import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface HolidayQuery {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
  isRecurring?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateHolidayData {
  tenantId: string;
  name: string;
  date: Date;
  isRecurring?: boolean;
}

interface UpdateHolidayData {
  name?: string;
  date?: Date;
  isRecurring?: boolean;
}

class HolidayService {
  async findAll(query: HolidayQuery) {
    const { tenantId, startDate, endDate, isRecurring, search, page = 1, limit = 10 } = query;

    const where: Prisma.HolidayWhereInput = {
      tenantId,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [holidays, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.holiday.count({ where }),
    ]);

    return {
      holidays,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, tenantId: string) {
    const holiday = await prisma.holiday.findFirst({
      where: { id, tenantId },
    });

    if (!holiday) {
      throw new Error('Holiday not found');
    }

    return holiday;
  }

  async create(data: CreateHolidayData) {
    const holiday = await prisma.holiday.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        date: data.date,
        isRecurring: data.isRecurring ?? false,
      },
    });

    return holiday;
  }

  async update(id: string, tenantId: string, data: UpdateHolidayData) {
    const holiday = await prisma.holiday.findFirst({
      where: { id, tenantId },
    });

    if (!holiday) {
      throw new Error('Holiday not found');
    }

    const updated = await prisma.holiday.update({
      where: { id },
      data,
    });

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const holiday = await prisma.holiday.findFirst({
      where: { id, tenantId },
    });

    if (!holiday) {
      throw new Error('Holiday not found');
    }

    await prisma.holiday.delete({
      where: { id },
    });
  }
}

export default new HolidayService();

