import { prisma } from '../database/client';
import { AppError } from '../types';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

export class SaleService {
  // Note: In the new schema, Sale requires posOrderId, so sales are created through POS orders
  // This method is kept for backward compatibility but may need refactoring
  
  async findAll(
    companyId: string,
    filters: z.infer<typeof paginationSchema> & {
      branchId?: string;
      customerId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [sales, total] = await Promise.all([
      (prisma as any).sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          pos: {
            include: {
              cashier: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).sale.count({ where }),
    ]);

    return {
      data: sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const sale = await (prisma as any).sale.findFirst({
      where: {
        id,
        tenantId: companyId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        pos: {
          include: {
            cashier: {
              select: {
                id: true,
                email: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    return sale;
  }
}

export default new SaleService();
