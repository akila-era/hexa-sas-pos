import prisma from '../database/client';

interface SettingData {
  key: string;
  value: string;
  type?: string;
  group?: string;
}

class SettingsService {
  async getAll(tenantId: string, group?: string) {
    const where = {
      tenantId,
      ...(group && { group }),
    };

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    // Convert to object format
    const result: Record<string, Record<string, any>> = {};
    settings.forEach(s => {
      if (!result[s.group]) {
        result[s.group] = {};
      }
      result[s.group][s.key] = this.parseValue(s.value, s.type);
    });

    return result;
  }

  async getByGroup(tenantId: string, group: string) {
    const settings = await prisma.setting.findMany({
      where: { tenantId, group },
      orderBy: { key: 'asc' },
    });

    const result: Record<string, any> = {};
    settings.forEach(s => {
      result[s.key] = this.parseValue(s.value, s.type);
    });

    return result;
  }

  async get(tenantId: string, group: string, key: string) {
    const setting = await prisma.setting.findFirst({
      where: { tenantId, group, key },
    });

    if (!setting) {
      return null;
    }

    return this.parseValue(setting.value, setting.type);
  }

  async set(tenantId: string, data: SettingData) {
    const { key, value, type = 'string', group = 'general' } = data;

    return prisma.setting.upsert({
      where: {
        tenantId_group_key: { tenantId, group, key },
      },
      create: {
        tenantId,
        group,
        key,
        value: this.stringifyValue(value),
        type,
      },
      update: {
        value: this.stringifyValue(value),
        type,
      },
    });
  }

  async setMany(tenantId: string, group: string, settings: Record<string, any>) {
    const operations = Object.entries(settings).map(([key, value]) => {
      const type = this.getType(value);
      return prisma.setting.upsert({
        where: {
          tenantId_group_key: { tenantId, group, key },
        },
        create: {
          tenantId,
          group,
          key,
          value: this.stringifyValue(value),
          type,
        },
        update: {
          value: this.stringifyValue(value),
          type,
        },
      });
    });

    return prisma.$transaction(operations);
  }

  async delete(tenantId: string, group: string, key: string) {
    return prisma.setting.deleteMany({
      where: { tenantId, group, key },
    });
  }

  async initializeDefaults(tenantId: string) {
    const defaults: Record<string, Record<string, any>> = {
      general: {
        siteName: 'HEXA POS',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        timezone: 'UTC',
        language: 'en',
      },
      company: {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        taxNumber: '',
        logo: '',
      },
      financial: {
        currency: 'USD',
        currencySymbol: '$',
        currencyPosition: 'before',
        decimalPlaces: 2,
        taxEnabled: true,
        defaultTaxRate: 0,
      },
      pos: {
        enableSound: true,
        enableKeyboard: true,
        defaultPaymentMethod: 'CASH',
        printReceiptAuto: false,
        showStock: true,
        lowStockAlert: 10,
      },
      invoice: {
        prefix: 'INV-',
        startNumber: 1,
        termsAndConditions: '',
        footerText: '',
      },
      notification: {
        emailEnabled: false,
        smsEnabled: false,
        lowStockNotification: true,
        dailyReportEmail: false,
      },
    };

    for (const [group, settings] of Object.entries(defaults)) {
      for (const [key, value] of Object.entries(settings)) {
        const existing = await prisma.setting.findFirst({
          where: { tenantId, group, key },
        });

        if (!existing) {
          await this.set(tenantId, { group, key, value });
        }
      }
    }

    return { message: 'Default settings initialized' };
  }

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private stringifyValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private getType(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'json';
    return 'string';
  }
}

export default new SettingsService();

