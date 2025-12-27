import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface ExpenseQuery {
  tenantId: string;
  categoryId?: string;
  accountId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateExpenseData {
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

interface UpdateExpenseData {
  categoryId?: string;
  amount?: number;
  date?: Date;
  reference?: string;
  description?: string;
  attachment?: string;
  status?: string;
}

class ExpenseService {
  async findAll(query: ExpenseQuery) {
    const {
      tenantId,
      categoryId,
      accountId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = query;

    const where: Prisma.ExpenseWhereInput = {
      tenantId,
      ...(categoryId && { categoryId }),
      ...(accountId && { accountId }),
      ...(status && { status }),
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

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          account: { select: { id: true, code: true, name: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        account: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return expense;
  }

  async create(data: CreateExpenseData) {
    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data,
        include: {
          category: true,
          account: true,
        },
      });

      // Deduct from account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: data.amount } },
      });

      // Create journal entry
      await tx.journalEntry.create({
        data: {
          accountId: data.accountId,
          date: data.date,
          credit: data.amount,
          description: data.description || `Expense: ${expense.category.name}`,
          refType: 'EXPENSE',
          refId: expense.id,
          createdBy: data.createdBy,
        },
      });

      return expense;
    });
  }

  async update(id: string, tenantId: string, data: UpdateExpenseData) {
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    // If amount changed, adjust account balance
    if (data.amount && data.amount !== Number(expense.amount)) {
      const difference = data.amount - Number(expense.amount);
      await prisma.account.update({
        where: { id: expense.accountId },
        data: { balance: { decrement: difference } },
      });
    }

    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return prisma.$transaction(async (tx) => {
      // Restore account balance
      await tx.account.update({
        where: { id: expense.accountId },
        data: { balance: { increment: Number(expense.amount) } },
      });

      // Delete journal entry
      await tx.journalEntry.deleteMany({
        where: { refType: 'EXPENSE', refId: id },
      });

      return tx.expense.delete({ where: { id } });
    });
  }

  async getByCategory(tenantId: string, startDate: Date, endDate: Date) {
    const expenses = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
        status: 'APPROVED',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categories = await prisma.expenseCategory.findMany({
      where: { tenantId },
    });

    return expenses.map(e => ({
      category: categories.find(c => c.id === e.categoryId),
      total: e._sum.amount,
      count: e._count.id,
    }));
  }

  async getSummary(tenantId: string, startDate: Date, endDate: Date) {
    const result = await prisma.expense.aggregate({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
        status: 'APPROVED',
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

export default new ExpenseService();

// Expense Category Service
export class ExpenseCategoryService {
  async findAll(tenantId: string) {
    return prisma.expenseCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { expenses: true } },
      },
    });
  }

  async create(tenantId: string, data: { name: string; description?: string }) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { tenantId, name: data.name },
    });

    if (existing) {
      throw new Error('Category with this name already exists');
    }

    return prisma.expenseCategory.create({
      data: { tenantId, ...data },
    });
  }

  async update(id: string, tenantId: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return prisma.expenseCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { expenses: true } } },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.expenses > 0) {
      throw new Error('Cannot delete category with expenses');
    }

    return prisma.expenseCategory.delete({ where: { id } });
  }
}

export const expenseCategoryService = new ExpenseCategoryService();

