import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { z } from 'zod';

// Validation schemas
export const variantCreateSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  cost: z.number().optional().nullable(),
  stock: z.number().int().default(0),
  attributes: z.record(z.string()).optional().nullable(), // { "color": "red", "size": "L" }
  isActive: z.boolean().optional().default(true),
});

export const variantUpdateSchema = variantCreateSchema.partial().omit({ productId: true });

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class VariantService {
  async create(tenantId: string, data: z.infer<typeof variantCreateSchema>) {
    const validated = variantCreateSchema.parse(data);

    // Verify product exists and belongs to tenant
    const product = await (prisma as any).product.findFirst({
      where: {
        id: validated.productId,
        tenantId,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Check if variant name already exists for this product
    const existing = await (prisma as any).productVariant.findFirst({
      where: {
        productId: validated.productId,
        name: validated.name,
      },
    });

    if (existing) {
      throw new AppErrorClass('Variant with this name already exists for this product', 409, 'VARIANT_EXISTS');
    }

    const variant = await (prisma as any).productVariant.create({
      data: {
        productId: validated.productId,
        name: validated.name,
        sku: validated.sku || null,
        barcode: validated.barcode || null,
        price: validated.price || null,
        cost: validated.cost || null,
        stock: validated.stock || 0,
        attributes: validated.attributes || null,
        isActive: validated.isActive ?? true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    return variant;
  }

  async findAll(tenantId: string, filters: z.infer<typeof paginationSchema> & {
    search?: string;
    productId?: string;
    isActive?: boolean;
  }) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      product: {
        tenantId,
      },
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.productId) {
      where.productId = filters.productId;
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

    const [variants, total] = await Promise.all([
      (prisma as any).productVariant.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).productVariant.count({ where }),
    ]);

    return {
      data: variants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const variant = await (prisma as any).productVariant.findFirst({
      where: {
        id,
        product: {
          tenantId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            tenantId: true,
          },
        },
      },
    });

    if (!variant) {
      throw new AppErrorClass('Variant not found', 404, 'VARIANT_NOT_FOUND');
    }

    return variant;
  }

  async findByProduct(tenantId: string, productId: string) {
    // Verify product exists and belongs to tenant
    const product = await (prisma as any).product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const variants = await (prisma as any).productVariant.findMany({
      where: {
        productId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return variants;
  }

  async update(tenantId: string, id: string, data: z.infer<typeof variantUpdateSchema>) {
    const validated = variantUpdateSchema.parse(data);

    // Verify variant exists and belongs to tenant's product
    const existing = await (prisma as any).productVariant.findFirst({
      where: {
        id,
        product: {
          tenantId,
        },
      },
    });

    if (!existing) {
      throw new AppErrorClass('Variant not found', 404, 'VARIANT_NOT_FOUND');
    }

    // Check for duplicate name if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await (prisma as any).productVariant.findFirst({
        where: {
          productId: existing.productId,
          name: validated.name,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new AppErrorClass('Variant with this name already exists for this product', 409, 'VARIANT_EXISTS');
      }
    }

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.sku !== undefined) updateData.sku = validated.sku;
    if (validated.barcode !== undefined) updateData.barcode = validated.barcode;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.cost !== undefined) updateData.cost = validated.cost;
    if (validated.stock !== undefined) updateData.stock = validated.stock;
    if (validated.attributes !== undefined) updateData.attributes = validated.attributes;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const variant = await (prisma as any).productVariant.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    return variant;
  }

  async delete(tenantId: string, id: string) {
    const variant = await (prisma as any).productVariant.findFirst({
      where: {
        id,
        product: {
          tenantId,
        },
      },
    });

    if (!variant) {
      throw new AppErrorClass('Variant not found', 404, 'VARIANT_NOT_FOUND');
    }

    await (prisma as any).productVariant.delete({
      where: { id },
    });

    return { message: 'Variant deleted successfully' };
  }

  // Bulk create variants for a product
  async bulkCreate(tenantId: string, productId: string, variants: Omit<z.infer<typeof variantCreateSchema>, 'productId'>[]) {
    // Verify product exists and belongs to tenant
    const product = await (prisma as any).product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const createdVariants = await (prisma as any).productVariant.createMany({
      data: variants.map((v) => ({
        productId,
        name: v.name,
        sku: v.sku || null,
        barcode: v.barcode || null,
        price: v.price || null,
        cost: v.cost || null,
        stock: v.stock || 0,
        attributes: v.attributes || null,
        isActive: v.isActive ?? true,
      })),
    });

    return { count: createdVariants.count, message: 'Variants created successfully' };
  }
}

export default new VariantService();

