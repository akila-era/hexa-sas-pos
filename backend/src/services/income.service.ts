import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface IncomeQuery {
  tenantId: string;
  categoryId?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateIncomeData {
  tenantId: string;
  categoryId: string;
  accountId: string;
  amount: number;
  date: Date;
  reference?: string;
  description?: string;
  attachment?: string;
  createdBy?: string;
}

interface UpdateIncomeData {
  categoryId?: string;
  amount?: number;
  date?: Date;
  reference?: string;
  description?: string;
  attachment?: string;
}

class IncomeService {
  async findAll(query: IncomeQuery) {
    const {
      tenantId,
      categoryId,
      accountId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = query;

    const where: Prisma.IncomeWhereInput = {
      tenantId,
      ...(categoryId && { categoryId }),
      ...(accountId && { accountId }),
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
      ...(search && {
        OR: [
          { reference: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          account: { select: { id: true, code: true, name: true } },
        },
      }),
      prisma.income.count({ where }),
    ]);

    return { incomes, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const income = await prisma.income.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        account: true,
      },
    });

    if (!income) {
      throw new Error('Income not found');
    }

    return income;
  }

  async create(data: CreateIncomeData) {
    return prisma.$transaction(async (tx) => {
      const income = await tx.income.create({
        data,
        include: {
          category: true,
          account: true,
        },
      });

      // Add to account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: data.amount } },
      });

      // Create journal entry
      await tx.journalEntry.create({
        data: {
          accountId: data.accountId,
          date: data.date,
          debit: data.amount,
          description: data.description || `Income: ${income.category.name}`,
          refType: 'INCOME',
          refId: income.id,
          createdBy: data.createdBy,
        },
      });

      return income;
    });
  }

  async update(id: string, tenantId: string, data: UpdateIncomeData) {
    const income = await prisma.income.findFirst({
      where: { id, tenantId },
    });

    if (!income) {
      throw new Error('Income not found');
    }

    // If amount changed, adjust account balance
    if (data.amount && data.amount !== Number(income.amount)) {
      const difference = data.amount - Number(income.amount);
      await prisma.account.update({
        where: { id: income.accountId },
        data: { balance: { increment: difference } },
      });
    }

    return prisma.income.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const income = await prisma.income.findFirst({
      where: { id, tenantId },
    });

    if (!income) {
      throw new Error('Income not found');
    }

    return prisma.$transaction(async (tx) => {
      // Deduct from account balance
      await tx.account.update({
        where: { id: income.accountId },
        data: { balance: { decrement: Number(income.amount) } },
      });

      // Delete journal entry
      await tx.journalEntry.deleteMany({
        where: { refType: 'INCOME', refId: id },
      });

      return tx.income.delete({ where: { id } });
    });
  }

  async getByCategory(tenantId: string, startDate: Date, endDate: Date) {
    const incomes = await prisma.income.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categories = await prisma.incomeCategory.findMany({
      where: { tenantId },
    });

    return incomes.map(i => ({
      category: categories.find(c => c.id === i.categoryId),
      total: i._sum.amount,
      count: i._count.id,
    }));
  }

  async getSummary(tenantId: string, startDate: Date, endDate: Date) {
    const result = await prisma.income.aggregate({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      total: result._sum.amount || 0,
      count: result._count.id || 0,
    };
  }
}

export default new IncomeService();

// Income Category Service
export class IncomeCategoryService {
  async findAll(tenantId: string) {
    return prisma.incomeCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { incomes: true } },
      },
    });
  }

  async create(tenantId: string, data: { name: string; description?: string }) {
    const existing = await prisma.incomeCategory.findFirst({
      where: { tenantId, name: data.name },
    });

    if (existing) {
      throw new Error('Category with this name already exists');
    }

    return prisma.incomeCategory.create({
      data: { tenantId, ...data },
    });
  }

  async update(id: string, tenantId: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const category = await prisma.incomeCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return prisma.incomeCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const category = await prisma.incomeCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { incomes: true } } },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.incomes > 0) {
      throw new Error('Cannot delete category with income records');
    }

    return prisma.incomeCategory.delete({ where: { id } });
  }
}

export const incomeCategoryService = new IncomeCategoryService();

