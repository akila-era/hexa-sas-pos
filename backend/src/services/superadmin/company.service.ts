import { prisma } from '../../database/client';
import { AppError } from '../../middlewares/error.middleware';
import { hashPassword } from '../../utils/auth.utils';
import {
  SuperAdminCompanyCreate,
  SuperAdminCompanyUpdate,
  CompanyUpgrade,
  CompanyFilter,
} from '../../utils/superadmin.validation';

export class SuperAdminCompanyService {
  /**
   * Create a new company with optional admin user
   */
  async create(data: SuperAdminCompanyCreate) {
    // Check if company with this name already exists
    const existingName = await prisma.tenant.findFirst({
      where: { name: data.name },
    });

    if (existingName) {
      throw new AppError('Company with this name already exists', 409, 'COMPANY_EXISTS');
    }

    // Check if accountUrl is unique
    if (data.accountUrl) {
      const existingUrl = await prisma.tenant.findUnique({
        where: { accountUrl: data.accountUrl },
      });

      if (existingUrl) {
        throw new AppError('Account URL already in use', 409, 'ACCOUNT_URL_EXISTS');
      }
    }

    // Create company in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the company (tenant)
      const company = await tx.tenant.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          website: data.website,
          address: data.address,
          accountUrl: data.accountUrl,
          currency: data.currency || 'USD',
          language: data.language || 'English',
          plan: data.plan || 'FREE',
          isActive: data.isActive ?? true,
          logo: data.logo,
        },
      });

      // Create default branch
      const branch = await tx.branch.create({
        data: {
          tenantId: company.id,
          name: 'Main Branch',
          isActive: true,
        },
      });

      // Create default admin role
      const role = await tx.role.create({
        data: {
          tenantId: company.id,
          name: 'Admin',
        },
      });

      // Create admin user if password provided
      let adminUser = null;
      if (data.password && data.email) {
        const hashedPassword = await hashPassword(data.password);
        adminUser = await tx.user.create({
          data: {
            tenantId: company.id,
            branchId: branch.id,
            roleId: role.id,
            email: data.email,
            password: hashedPassword,
            isActive: true,
          },
        });
      }

      return { company, branch, role, adminUser };
    });

    return result.company;
  }

  /**
   * Get all companies with filters and pagination
   */
  async findAll(filters: CompanyFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status && filters.status !== 'all') {
      where.isActive = filters.status === 'active';
    }

    if (filters.plan) {
      where.plan = {
        contains: filters.plan,
        mode: 'insensitive',
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { accountUrl: { contains: filters.search, mode: 'insensitive' } },
      ];
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

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [companies, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          subscriptions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              package: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  price: true,
                },
              },
            },
          },
          _count: {
            select: {
              users: true,
              branches: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    // Format response
    const formattedCompanies = companies.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      accountUrl: c.accountUrl,
      currency: c.currency,
      language: c.language,
      isActive: c.isActive,
      logo: c.logo,
      createdAt: c.createdAt,
      plan: c.subscriptions[0]?.package?.name || c.plan,
      planType: c.subscriptions[0]?.package?.type || null,
      usersCount: c._count.users,
      branchesCount: c._count.branches,
    }));

    return {
      data: formattedCompanies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single company by ID
   */
  async findOne(id: string) {
    const company = await prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            package: true,
          },
        },
        domains: true,
        _count: {
          select: {
            users: true,
            products: true,
            customers: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    return company;
  }

  /**
   * Update a company
   */
  async update(id: string, data: SuperAdminCompanyUpdate) {
    const company = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Check accountUrl uniqueness if updating
    if (data.accountUrl && data.accountUrl !== company.accountUrl) {
      const existingUrl = await prisma.tenant.findUnique({
        where: { accountUrl: data.accountUrl },
      });

      if (existingUrl) {
        throw new AppError('Account URL already in use', 409, 'ACCOUNT_URL_EXISTS');
      }
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.accountUrl !== undefined && { accountUrl: data.accountUrl }),
        ...(data.currency && { currency: data.currency }),
        ...(data.language && { language: data.language }),
        ...(data.plan && { plan: data.plan }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.logo !== undefined && { logo: data.logo }),
      },
    });

    return updated;
  }

  /**
   * Delete a company
   */
  async delete(id: string) {
    const company = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Soft delete by deactivating
    await prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Company deactivated successfully' };
  }

  /**
   * Upgrade company plan
   */
  async upgradePlan(id: string, data: CompanyUpgrade) {
    const company = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
    });

    if (!pkg) {
      throw new AppError('Package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        companyId: id,
        packageId: data.packageId,
        billingCycle: data.planType === 'Monthly' ? 30 : 365,
        amount: data.amount,
        paymentMethod: 'Upgrade',
        status: 'PAID',
        startDate: new Date(data.paymentDate),
        expiryDate: new Date(data.expiryDate),
      },
    });

    // Update company plan
    await prisma.tenant.update({
      where: { id },
      data: { plan: pkg.name },
    });

    // Create transaction
    const invoiceId = `INV${Date.now()}`;
    await prisma.transaction.create({
      data: {
        subscriptionId: subscription.id,
        invoiceId,
        amount: data.amount,
        paymentMethod: 'Upgrade',
        status: 'PAID',
      },
    });

    return subscription;
  }

  /**
   * Get company statistics
   */
  async getStats() {
    const [total, active, inactive, locations] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.tenant.count({ where: { isActive: false } }),
      prisma.branch.count(),
    ]);

    return {
      totalCompanies: total,
      activeCompanies: active,
      inactiveCompanies: inactive,
      companyLocations: locations,
    };
  }

  /**
   * Toggle company status (activate/deactivate)
   */
  async toggleStatus(id: string) {
    const company = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: { isActive: !company.isActive },
    });

    return updated;
  }
}

export default new SuperAdminCompanyService();









