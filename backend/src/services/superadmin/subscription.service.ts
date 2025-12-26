import { prisma } from '../../database/client';
import { AppError } from '../../middlewares/error.middleware';
import {
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionFilter,
} from '../../utils/superadmin.validation';

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  async create(data: SubscriptionCreate) {
    // Verify company exists
    const company = await prisma.tenant.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Verify package exists
    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
    });

    if (!pkg) {
      throw new AppError('Package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    const subscription = await prisma.subscription.create({
      data: {
        companyId: data.companyId,
        packageId: data.packageId,
        billingCycle: data.billingCycle || 30,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: data.status || 'PAID',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        expiryDate: new Date(data.expiryDate),
      },
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
    });

    return subscription;
  }

  /**
   * Get all subscriptions with filters and pagination
   */
  async findAll(filters: SubscriptionFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.plan) {
      where.package = {
        name: {
          contains: filters.plan,
          mode: 'insensitive',
        },
      };
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
              price: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single subscription by ID
   */
  async findOne(id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        company: true,
        package: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    return subscription;
  }

  /**
   * Update a subscription
   */
  async update(id: string, data: SubscriptionUpdate) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        ...(data.billingCycle !== undefined && { billingCycle: data.billingCycle }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.status && { status: data.status }),
        ...(data.expiryDate && { expiryDate: new Date(data.expiryDate) }),
      },
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
    });

    return updated;
  }

  /**
   * Delete a subscription
   */
  async delete(id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    // Delete associated transactions first
    if (subscription._count.transactions > 0) {
      await prisma.transaction.deleteMany({
        where: { subscriptionId: id },
      });
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return { message: 'Subscription deleted successfully' };
  }

  /**
   * Get subscription statistics
   */
  async getStats() {
    const now = new Date();

    const [
      totalTransactionAmount,
      totalSubscribers,
      activeSubscribers,
      expiredSubscribers,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      prisma.subscription.count(),
      prisma.subscription.count({
        where: {
          status: 'PAID',
          expiryDate: { gt: now },
        },
      }),
      prisma.subscription.count({
        where: {
          OR: [
            { status: 'EXPIRED' },
            { expiryDate: { lte: now } },
          ],
        },
      }),
    ]);

    return {
      totalTransaction: totalTransactionAmount._sum.amount || 0,
      totalSubscribers,
      activeSubscribers,
      expiredSubscribers,
    };
  }

  /**
   * Check and update expired subscriptions
   */
  async updateExpiredSubscriptions() {
    const now = new Date();

    const result = await prisma.subscription.updateMany({
      where: {
        expiryDate: { lte: now },
        status: { not: 'EXPIRED' },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return { updatedCount: result.count };
  }
}

export default new SubscriptionService();









