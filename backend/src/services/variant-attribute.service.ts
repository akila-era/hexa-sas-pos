import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { z } from 'zod';

// Validation schemas
export const variantAttributeCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  values: z.string().min(1, 'Values are required'), // Comma-separated values
  isActive: z.boolean().optional().default(true),
});

export const variantAttributeUpdateSchema = variantAttributeCreateSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class VariantAttributeService {
  // Format date for frontend
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  async create(tenantId: string, data: z.infer<typeof variantAttributeCreateSchema>) {
    const validated = variantAttributeCreateSchema.parse(data);

    // Check if variant attribute name already exists for this tenant
    const existing = await (prisma as any).variantAttribute.findFirst({
      where: {
        tenantId,
        name: validated.name,
      },
    });

    if (existing) {
      throw new AppErrorClass('Variant attribute with this name already exists', 409, 'VARIANT_ATTRIBUTE_EXISTS');
    }

    const variantAttribute = await (prisma as any).variantAttribute.create({
      data: {
        tenantId,
        name: validated.name,
        values: validated.values,
        isActive: validated.isActive ?? true,
      },
    });

    // Format for frontend
    return {
      id: variantAttribute.id,
      variant: variantAttribute.name,
      values: variantAttribute.values,
      createdon: this.formatDate(variantAttribute.createdAt),
      status: variantAttribute.isActive ? 'Active' : 'Inactive',
    };
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
        { values: { contains: filters.search, mode: 'insensitive' } },
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

    const [variantAttributes, total] = await Promise.all([
      (prisma as any).variantAttribute.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).variantAttribute.count({ where }),
    ]);

    // Format for frontend
    const formattedData = variantAttributes.map((va: any) => ({
      id: va.id,
      variant: va.name,
      values: va.values,
      createdon: this.formatDate(va.createdAt),
      status: va.isActive ? 'Active' : 'Inactive',
    }));

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const variantAttribute = await (prisma as any).variantAttribute.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!variantAttribute) {
      throw new AppErrorClass('Variant attribute not found', 404, 'VARIANT_ATTRIBUTE_NOT_FOUND');
    }

    // Format for frontend
    return {
      id: variantAttribute.id,
      variant: variantAttribute.name,
      values: variantAttribute.values,
      createdon: this.formatDate(variantAttribute.createdAt),
      status: variantAttribute.isActive ? 'Active' : 'Inactive',
    };
  }

  async update(tenantId: string, id: string, data: z.infer<typeof variantAttributeUpdateSchema>) {
    const validated = variantAttributeUpdateSchema.parse(data);

    // Verify variant attribute exists
    const existing = await (prisma as any).variantAttribute.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new AppErrorClass('Variant attribute not found', 404, 'VARIANT_ATTRIBUTE_NOT_FOUND');
    }

    // Check for duplicate name if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await (prisma as any).variantAttribute.findFirst({
        where: {
          tenantId,
          name: validated.name,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new AppErrorClass('Variant attribute with this name already exists', 409, 'VARIANT_ATTRIBUTE_EXISTS');
      }
    }

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.values !== undefined) updateData.values = validated.values;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const variantAttribute = await (prisma as any).variantAttribute.update({
      where: { id },
      data: updateData,
    });

    // Format for frontend
    return {
      id: variantAttribute.id,
      variant: variantAttribute.name,
      values: variantAttribute.values,
      createdon: this.formatDate(variantAttribute.createdAt),
      status: variantAttribute.isActive ? 'Active' : 'Inactive',
    };
  }

  async delete(tenantId: string, id: string) {
    const variantAttribute = await (prisma as any).variantAttribute.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!variantAttribute) {
      throw new AppErrorClass('Variant attribute not found', 404, 'VARIANT_ATTRIBUTE_NOT_FOUND');
    }

    await (prisma as any).variantAttribute.delete({
      where: { id },
    });

    return { message: 'Variant attribute deleted successfully' };
  }
}

export default new VariantAttributeService();

