import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { z } from 'zod';

// Validation schemas
export const warrantyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(1, 'Duration must be at least 1'),
  period: z.enum(['DAYS', 'WEEKS', 'MONTHS', 'YEARS']),
  isActive: z.boolean().optional().default(true),
});

export const warrantyUpdateSchema = warrantyCreateSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class WarrantyService {
  async create(tenantId: string, data: z.infer<typeof warrantyCreateSchema>) {
    const validated = warrantyCreateSchema.parse(data);

    // Check if warranty name already exists for this tenant
    const existing = await (prisma as any).warranty.findFirst({
      where: {
        tenantId,
        name: validated.name,
      },
    });

    if (existing) {
      throw new AppErrorClass('Warranty with this name already exists', 409, 'WARRANTY_EXISTS');
    }

    const warranty = await (prisma as any).warranty.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description || null,
        duration: validated.duration,
        period: validated.period,
        isActive: validated.isActive ?? true,
      },
    });

    return warranty;
  }

  async findAll(tenantId: string, filters: z.infer<typeof paginationSchema> & {
    search?: string;
    isActive?: boolean;
  }) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [warranties, total] = await Promise.all([
      (prisma as any).warranty.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).warranty.count({ where }),
    ]);

    // Format duration for display
    const formattedWarranties = warranties.map((w: any) => ({
      ...w,
      durationDisplay: `${w.duration} ${w.period.toLowerCase()}${w.duration > 1 ? '' : ''}`,
    }));

    return {
      data: formattedWarranties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const warranty = await (prisma as any).warranty.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!warranty) {
      throw new AppErrorClass('Warranty not found', 404, 'WARRANTY_NOT_FOUND');
    }

    return {
      ...warranty,
      durationDisplay: `${warranty.duration} ${warranty.period.toLowerCase()}${warranty.duration > 1 ? '' : ''}`,
    };
  }

  async update(tenantId: string, id: string, data: z.infer<typeof warrantyUpdateSchema>) {
    const validated = warrantyUpdateSchema.parse(data);

    // Verify warranty exists
    const existing = await (prisma as any).warranty.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new AppErrorClass('Warranty not found', 404, 'WARRANTY_NOT_FOUND');
    }

    // Check for duplicate name if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await (prisma as any).warranty.findFirst({
        where: {
          tenantId,
          name: validated.name,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new AppErrorClass('Warranty with this name already exists', 409, 'WARRANTY_EXISTS');
      }
    }

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.duration !== undefined) updateData.duration = validated.duration;
    if (validated.period !== undefined) updateData.period = validated.period;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const warranty = await (prisma as any).warranty.update({
      where: { id },
      data: updateData,
    });

    return {
      ...warranty,
      durationDisplay: `${warranty.duration} ${warranty.period.toLowerCase()}${warranty.duration > 1 ? '' : ''}`,
    };
  }

  async delete(tenantId: string, id: string) {
    const warranty = await (prisma as any).warranty.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!warranty) {
      throw new AppErrorClass('Warranty not found', 404, 'WARRANTY_NOT_FOUND');
    }

    await (prisma as any).warranty.delete({
      where: { id },
    });

    return { message: 'Warranty deleted successfully' };
  }
}

export default new WarrantyService();

