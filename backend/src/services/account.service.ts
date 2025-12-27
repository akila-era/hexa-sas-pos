import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface AccountQuery {
  tenantId: string;
  type?: string;
  subType?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateAccountData {
  tenantId: string;
  parentId?: string;
  code: string;
  name: string;
  type: string;
  subType?: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateAccountData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

class AccountService {
  async findAll(query: AccountQuery) {
    const {
      tenantId,
      type,
      subType,
      isActive,
      search,
      page = 1,
      limit = 50,
    } = query;

    const where: Prisma.AccountWhereInput = {
      tenantId,
      ...(type && { type }),
      ...(subType && { subType }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          parent: { select: { id: true, code: true, name: true } },
          _count: { select: { children: true } },
        },
      }),
      prisma.account.count({ where }),
    ]);

    return { accounts, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const account = await prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async create(data: CreateAccountData) {
    const existing = await prisma.account.findFirst({
      where: { tenantId: data.tenantId, code: data.code },
    });

    if (existing) {
      throw new Error('Account with this code already exists');
    }

    return prisma.account.create({ data });
  }

  async update(id: string, tenantId: string, data: UpdateAccountData) {
    const account = await prisma.account.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.isSystem) {
      throw new Error('Cannot modify system account');
    }

    return prisma.account.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const account = await prisma.account.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { children: true, journalEntries: true } } },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.isSystem) {
      throw new Error('Cannot delete system account');
    }

    if (account._count.children > 0) {
      throw new Error('Cannot delete account with sub-accounts');
    }

    if (account._count.journalEntries > 0) {
      throw new Error('Cannot delete account with transactions');
    }

    return prisma.account.delete({ where: { id } });
  }

  async getChartOfAccounts(tenantId: string) {
    const accounts = await prisma.account.findMany({
      where: { tenantId, parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return accounts;
  }

  async updateBalance(id: string, amount: number) {
    return prisma.account.update({
      where: { id },
      data: {
        balance: { increment: amount },
      },
    });
  }

  async getAccountStatement(
    id: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const account = await prisma.account.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const entries = await prisma.journalEntry.findMany({
      where: {
        accountId: id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate running balance
    let runningBalance = Number(account.balance);
    
    // Get opening balance by subtracting entries after start date
    const afterStartEntries = entries.filter(e => e.date >= startDate);
    afterStartEntries.forEach(e => {
      runningBalance -= Number(e.debit) - Number(e.credit);
    });

    const openingBalance = runningBalance;
    runningBalance = openingBalance;

    const statement = entries.map(entry => {
      runningBalance += Number(entry.debit) - Number(entry.credit);
      return {
        ...entry,
        runningBalance,
      };
    });

    return {
      account,
      openingBalance,
      closingBalance: runningBalance,
      totalDebit: entries.reduce((sum, e) => sum + Number(e.debit), 0),
      totalCredit: entries.reduce((sum, e) => sum + Number(e.credit), 0),
      entries: statement,
    };
  }

  async initializeDefaultAccounts(tenantId: string) {
    const defaultAccounts = [
      // Assets
      { code: '1000', name: 'Assets', type: 'ASSET', subType: null },
      { code: '1100', name: 'Cash', type: 'ASSET', subType: 'CASH', parentCode: '1000' },
      { code: '1200', name: 'Bank', type: 'ASSET', subType: 'BANK', parentCode: '1000' },
      { code: '1300', name: 'Accounts Receivable', type: 'ASSET', subType: 'RECEIVABLE', parentCode: '1000' },
      { code: '1400', name: 'Inventory', type: 'ASSET', subType: 'INVENTORY', parentCode: '1000' },
      
      // Liabilities
      { code: '2000', name: 'Liabilities', type: 'LIABILITY', subType: null },
      { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', subType: 'PAYABLE', parentCode: '2000' },
      { code: '2200', name: 'Tax Payable', type: 'LIABILITY', subType: 'TAX', parentCode: '2000' },
      
      // Equity
      { code: '3000', name: 'Equity', type: 'EQUITY', subType: null },
      { code: '3100', name: 'Capital', type: 'EQUITY', subType: 'CAPITAL', parentCode: '3000' },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', subType: 'RETAINED', parentCode: '3000' },
      
      // Income
      { code: '4000', name: 'Income', type: 'INCOME', subType: null },
      { code: '4100', name: 'Sales Revenue', type: 'INCOME', subType: 'SALES', parentCode: '4000' },
      { code: '4200', name: 'Other Income', type: 'INCOME', subType: 'OTHER', parentCode: '4000' },
      
      // Expenses
      { code: '5000', name: 'Expenses', type: 'EXPENSE', subType: null },
      { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COGS', parentCode: '5000' },
      { code: '5200', name: 'Operating Expenses', type: 'EXPENSE', subType: 'OPERATING', parentCode: '5000' },
      { code: '5300', name: 'Salary Expenses', type: 'EXPENSE', subType: 'SALARY', parentCode: '5000' },
    ];

    // Create parent accounts first
    const parentAccounts = defaultAccounts.filter(a => !a.parentCode);
    const createdParents: Record<string, string> = {};

    for (const acc of parentAccounts) {
      const existing = await prisma.account.findFirst({
        where: { tenantId, code: acc.code },
      });

      if (!existing) {
        const created = await prisma.account.create({
          data: {
            tenantId,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            subType: acc.subType,
            isSystem: true,
          },
        });
        createdParents[acc.code] = created.id;
      } else {
        createdParents[acc.code] = existing.id;
      }
    }

    // Create child accounts
    const childAccounts = defaultAccounts.filter(a => a.parentCode);
    for (const acc of childAccounts) {
      const existing = await prisma.account.findFirst({
        where: { tenantId, code: acc.code },
      });

      if (!existing && acc.parentCode) {
        await prisma.account.create({
          data: {
            tenantId,
            parentId: createdParents[acc.parentCode],
            code: acc.code,
            name: acc.name,
            type: acc.type,
            subType: acc.subType,
            isSystem: true,
          },
        });
      }
    }

    return { message: 'Default accounts initialized' };
  }
}

export default new AccountService();

