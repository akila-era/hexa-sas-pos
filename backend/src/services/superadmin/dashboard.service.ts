import { prisma } from '../../database/client';

export class DashboardService {
  /**
   * Get overall statistics for super admin dashboard
   */
  async getStats() {
    const [
      totalCompanies,
      activeCompanies,
      totalSubscribers,
      totalEarnings,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.subscription.count({ where: { status: 'PAID' } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
    ]);

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies: totalCompanies - activeCompanies,
      totalSubscribers,
      totalEarnings: totalEarnings._sum.amount || 0,
    };
  }

  /**
   * Get revenue chart data for the dashboard
   */
  async getRevenueData(year: number = new Date().getFullYear()) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'PAID',
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Group by month
    const monthlyRevenue = Array(12).fill(0);
    transactions.forEach((t) => {
      const month = new Date(t.createdAt).getMonth();
      monthlyRevenue[month] += Number(t.amount);
    });

    return {
      year,
      months: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ],
      revenue: monthlyRevenue,
    };
  }

  /**
   * Get recent transactions for dashboard
   */
  async getRecentTransactions(limit: number = 5) {
    const transactions = await prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
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
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      invoiceId: t.invoiceId,
      amount: t.amount,
      status: t.status,
      paymentMethod: t.paymentMethod,
      createdAt: t.createdAt,
      company: t.subscription.company,
      plan: `${t.subscription.package.name} (${t.subscription.package.type})`,
    }));
  }

  /**
   * Get recently registered companies
   */
  async getRecentlyRegistered(limit: number = 5) {
    const companies = await prisma.tenant.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            package: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo,
      createdAt: c.createdAt,
      usersCount: c._count.users,
      plan: c.subscriptions[0]
        ? `${c.subscriptions[0].package.name} (${c.subscriptions[0].package.type})`
        : 'Free',
    }));
  }

  /**
   * Get companies with expired or expiring plans
   */
  async getExpiredPlans(limit: number = 5) {
    const now = new Date();

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { expiryDate: { lte: now } },
          { status: 'EXPIRED' },
        ],
      },
      take: limit,
      orderBy: { expiryDate: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            logo: true,
            accountUrl: true,
          },
        },
        package: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    return expiredSubscriptions.map((s) => ({
      id: s.id,
      company: s.company,
      plan: `${s.package.name} (${s.package.type})`,
      expiryDate: s.expiryDate,
      status: s.status,
    }));
  }

  /**
   * Get company counts by week for charts
   */
  async getCompanyChartData() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const companies = await prisma.tenant.findMany({
      where: {
        createdAt: {
          gte: weekAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by day of week
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dayCounts = Array(7).fill(0);

    companies.forEach((c) => {
      const dayIndex = new Date(c.createdAt).getDay();
      // Convert Sunday=0 to Monday=0 format
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      dayCounts[adjustedIndex]++;
    });

    return {
      labels: days,
      data: dayCounts,
    };
  }

  /**
   * Get plan distribution for pie chart
   */
  async getPlanDistribution() {
    const subscriptions = await prisma.subscription.groupBy({
      by: ['packageId'],
      where: { status: 'PAID' },
      _count: true,
    });

    const packages = await prisma.package.findMany({
      where: {
        id: { in: subscriptions.map((s) => s.packageId) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const packageMap = new Map(packages.map((p) => [p.id, p.name]));

    return subscriptions.map((s) => ({
      name: packageMap.get(s.packageId) || 'Unknown',
      count: s._count,
    }));
  }
}

export default new DashboardService();









