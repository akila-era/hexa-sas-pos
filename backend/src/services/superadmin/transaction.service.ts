import { prisma } from '../../database/client';
import { AppError } from '../../middlewares/error.middleware';
import {
  TransactionCreate,
  TransactionFilter,
} from '../../utils/superadmin.validation';

export class TransactionService {
  /**
   * Create a new transaction
   */
  async create(data: TransactionCreate) {
    // Verify subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    // Check if invoice ID already exists
    const existing = await prisma.transaction.findUnique({
      where: { invoiceId: data.invoiceId },
    });

    if (existing) {
      throw new AppError('Invoice ID already exists', 409, 'INVOICE_EXISTS');
    }

    const transaction = await prisma.transaction.create({
      data: {
        subscriptionId: data.subscriptionId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: data.status || 'PAID',
      },
      include: {
        subscription: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            package: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return transaction;
  }

  /**
   * Get all transactions with filters and pagination
   */
  async findAll(filters: TransactionFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = {
        contains: filters.paymentMethod,
        mode: 'insensitive',
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          subscription: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  logo: true,
                },
              },
              package: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Format response
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      invoiceId: t.invoiceId,
      amount: t.amount,
      paymentMethod: t.paymentMethod,
      status: t.status,
      createdAt: t.createdAt,
      company: t.subscription.company,
      plan: `${t.subscription.package.name} (${t.subscription.package.type})`,
    }));

    return {
      data: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single transaction by ID
   */
  async findOne(id: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            company: true,
            package: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    return transaction;
  }

  /**
   * Get transaction by invoice ID
   */
  async findByInvoiceId(invoiceId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { invoiceId },
      include: {
        subscription: {
          include: {
            company: true,
            package: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    return transaction;
  }

  /**
   * Update transaction status
   */
  async updateStatus(id: string, status: 'PAID' | 'UNPAID' | 'REFUNDED') {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status },
      include: {
        subscription: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a transaction
   */
  async delete(id: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return { message: 'Transaction deleted successfully' };
  }

  /**
   * Get transaction statistics
   */
  async getStats() {
    const [totalAmount, paidAmount, unpaidAmount, refundedAmount, totalCount] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'UNPAID' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'REFUNDED' },
      }),
      prisma.transaction.count(),
    ]);

    return {
      totalAmount: totalAmount._sum.amount || 0,
      paidAmount: paidAmount._sum.amount || 0,
      unpaidAmount: unpaidAmount._sum.amount || 0,
      refundedAmount: refundedAmount._sum.amount || 0,
      totalCount,
    };
  }

  /**
   * Generate a unique invoice ID
   */
  async generateInvoiceId(): Promise<string> {
    const lastTransaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceId: true },
    });

    let nextNumber = 1;
    if (lastTransaction?.invoiceId) {
      const match = lastTransaction.invoiceId.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    return `INV${nextNumber.toString().padStart(6, '0')}`;
  }
}

export default new TransactionService();









