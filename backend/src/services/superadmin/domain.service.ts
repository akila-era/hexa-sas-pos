import { prisma } from '../../database/client';
import { AppError } from '../../middlewares/error.middleware';
import {
  DomainCreate,
  DomainFilter,
} from '../../utils/superadmin.validation';

export class DomainService {
  /**
   * Create a new domain request
   */
  async create(data: DomainCreate) {
    // Verify company exists
    const company = await prisma.tenant.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Check if domain already exists
    const existing = await prisma.domain.findUnique({
      where: { domainUrl: data.domainUrl },
    });

    if (existing) {
      throw new AppError('Domain URL already registered', 409, 'DOMAIN_EXISTS');
    }

    const domain = await prisma.domain.create({
      data: {
        companyId: data.companyId,
        domainUrl: data.domainUrl,
        status: data.status || 'PENDING',
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            logo: true,
          },
        },
      },
    });

    return domain;
  }

  /**
   * Get all domains with filters and pagination
   */
  async findAll(filters: DomainFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    // Filter by plan type through company subscription
    if (filters.planType && filters.planType !== 'all') {
      where.company = {
        subscriptions: {
          some: {
            package: {
              type: filters.planType,
            },
          },
        },
      };
    }

    const [domains, total] = await Promise.all([
      prisma.domain.findMany({
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
              subscriptions: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                include: {
                  package: {
                    select: {
                      name: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.domain.count({ where }),
    ]);

    // Format response with plan info
    const formattedDomains = domains.map((d) => ({
      id: d.id,
      domainUrl: d.domainUrl,
      status: d.status,
      createdAt: d.createdAt,
      company: {
        id: d.company.id,
        name: d.company.name,
        email: d.company.email,
        logo: d.company.logo,
      },
      plan: d.company.subscriptions[0]
        ? `${d.company.subscriptions[0].package.name} (${d.company.subscriptions[0].package.type})`
        : 'Free',
    }));

    return {
      data: formattedDomains,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single domain by ID
   */
  async findOne(id: string) {
    const domain = await prisma.domain.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            subscriptions: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                package: true,
              },
            },
          },
        },
      },
    });

    if (!domain) {
      throw new AppError('Domain not found', 404, 'DOMAIN_NOT_FOUND');
    }

    return domain;
  }

  /**
   * Approve a domain
   */
  async approve(id: string) {
    const domain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new AppError('Domain not found', 404, 'DOMAIN_NOT_FOUND');
    }

    if (domain.status === 'APPROVED') {
      throw new AppError('Domain is already approved', 400, 'DOMAIN_ALREADY_APPROVED');
    }

    const updated = await prisma.domain.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Also update the company's accountUrl if not set
    if (!updated.company) {
      await prisma.tenant.update({
        where: { id: domain.companyId },
        data: { accountUrl: domain.domainUrl },
      });
    }

    return updated;
  }

  /**
   * Reject a domain
   */
  async reject(id: string) {
    const domain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new AppError('Domain not found', 404, 'DOMAIN_NOT_FOUND');
    }

    if (domain.status === 'REJECTED') {
      throw new AppError('Domain is already rejected', 400, 'DOMAIN_ALREADY_REJECTED');
    }

    const updated = await prisma.domain.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a domain
   */
  async delete(id: string) {
    const domain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new AppError('Domain not found', 404, 'DOMAIN_NOT_FOUND');
    }

    await prisma.domain.delete({
      where: { id },
    });

    return { message: 'Domain deleted successfully' };
  }

  /**
   * Get domain statistics
   */
  async getStats() {
    const [total, approved, pending, rejected] = await Promise.all([
      prisma.domain.count(),
      prisma.domain.count({ where: { status: 'APPROVED' } }),
      prisma.domain.count({ where: { status: 'PENDING' } }),
      prisma.domain.count({ where: { status: 'REJECTED' } }),
    ]);

    return {
      total,
      approved,
      pending,
      rejected,
    };
  }
}

export default new DomainService();









