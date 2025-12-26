import { prisma } from '../../database/client';
import { AppError } from '../../middlewares/error.middleware';
import {
  PackageCreate,
  PackageUpdate,
  paginationSchema,
} from '../../utils/superadmin.validation';

export class PackageService {
  /**
   * Create a new package/plan
   */
  async create(data: PackageCreate) {
    // Check if package with same name and type exists
    const existing = await prisma.package.findFirst({
      where: {
        name: data.name,
        type: data.type,
      },
    });

    if (existing) {
      throw new AppError(
        `Package "${data.name}" (${data.type}) already exists`,
        409,
        'PACKAGE_EXISTS'
      );
    }

    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        discount: data.discount || 0,
        discountType: data.discountType,
        maxCustomers: data.maxCustomers,
        maxProducts: data.maxProducts,
        maxInvoices: data.maxInvoices,
        maxSuppliers: data.maxSuppliers,
        modules: data.modules || [],
        isRecommended: data.isRecommended || false,
        trialDays: data.trialDays || 0,
        position: data.position || 0,
        status: data.status || 'ACTIVE',
        description: data.description,
        image: data.image,
      },
    });

    return pkg;
  }

  /**
   * Get all packages with pagination and filters
   */
  async findAll(filters: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 10 } = paginationSchema.parse(filters);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status.toUpperCase();
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              subscriptions: true,
            },
          },
        },
      }),
      prisma.package.count({ where }),
    ]);

    return {
      data: packages.map((p) => ({
        ...p,
        totalSubscribers: p._count.subscriptions,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single package by ID
   */
  async findOne(id: string) {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new AppError('Package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    return {
      ...pkg,
      totalSubscribers: pkg._count.subscriptions,
    };
  }

  /**
   * Update a package
   */
  async update(id: string, data: PackageUpdate) {
    const pkg = await prisma.package.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new AppError('Package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    // If changing name/type, check for duplicates
    if (data.name || data.type) {
      const existing = await prisma.package.findFirst({
        where: {
          name: data.name || pkg.name,
          type: data.type || pkg.type,
          NOT: { id },
        },
      });

      if (existing) {
        throw new AppError(
          `Package "${data.name || pkg.name}" (${data.type || pkg.type}) already exists`,
          409,
          'PACKAGE_EXISTS'
        );
      }
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(data.discountType !== undefined && { discountType: data.discountType }),
        ...(data.maxCustomers !== undefined && { maxCustomers: data.maxCustomers }),
        ...(data.maxProducts !== undefined && { maxProducts: data.maxProducts }),
        ...(data.maxInvoices !== undefined && { maxInvoices: data.maxInvoices }),
        ...(data.maxSuppliers !== undefined && { maxSuppliers: data.maxSuppliers }),
        ...(data.modules && { modules: data.modules }),
        ...(data.isRecommended !== undefined && { isRecommended: data.isRecommended }),
        ...(data.trialDays !== undefined && { trialDays: data.trialDays }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.status && { status: data.status }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
      },
    });

    return updated;
  }

  /**
   * Delete a package
   */
  async delete(id: string) {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!pkg) {
      throw new AppError('Package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    if (pkg._count.subscriptions > 0) {
      throw new AppError(
        'Cannot delete package with active subscriptions',
        400,
        'PACKAGE_HAS_SUBSCRIPTIONS'
      );
    }

    await prisma.package.delete({
      where: { id },
    });

    return { message: 'Package deleted successfully' };
  }

  /**
   * Get package statistics
   */
  async getStats() {
    const [total, active, inactive, planTypes] = await Promise.all([
      prisma.package.count(),
      prisma.package.count({ where: { status: 'ACTIVE' } }),
      prisma.package.count({ where: { status: 'INACTIVE' } }),
      prisma.package.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    return {
      totalPlans: total,
      activePlans: active,
      inactivePlans: inactive,
      planTypes: planTypes.length,
    };
  }
}

export default new PackageService();









