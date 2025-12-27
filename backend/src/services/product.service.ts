import { prisma } from '../database/client';
import { AppError } from '../types';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { productCreateSchema, productUpdateSchema, paginationSchema } from '../utils/validation';
import { z } from 'zod';

export class ProductService {
  async create(companyId: string, data: z.infer<typeof productCreateSchema>, createdBy?: string) {
    const validated = productCreateSchema.parse(data);

    // Check if SKU already exists for this tenant
    const existing = await (prisma as any).product.findFirst({
      where: {
        tenantId: companyId,
        sku: validated.sku,
      },
    });

    if (existing) {
      throw new AppErrorClass('SKU already exists', 409, 'SKU_EXISTS');
    }

    // Validate category - categoryId is required in new schema
    let categoryId: string;
    if (validated.categoryId) {
      const category = await (prisma as any).category.findFirst({
        where: {
          id: String(validated.categoryId),
          tenantId: companyId,
        },
      });
      if (!category) {
        throw new AppErrorClass('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
      categoryId = category.id;
    } else {
      throw new AppErrorClass('Category is required', 400, 'CATEGORY_REQUIRED');
    }

    const product = await (prisma as any).product.create({
      data: {
        tenantId: companyId,
        categoryId: categoryId,
        name: validated.name,
        sku: validated.sku,
        price: validated.sellingPrice || validated.basePrice,
        cost: validated.costPrice || null,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    return product;
  }

  async findAll(companyId: string, filters: z.infer<typeof paginationSchema> & {
    search?: string;
    categoryId?: number;
    isActive?: boolean;
  }) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: companyId,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = String(filters.categoryId);
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

    const [products, total] = await Promise.all([
      (prisma as any).product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const product = await (prisma as any).product.findFirst({
      where: {
        id,
        tenantId: companyId,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  async update(companyId: string, id: string, data: z.infer<typeof productUpdateSchema>) {
    const validated = productUpdateSchema.parse(data);

    // Verify product exists and belongs to tenant
    const existing = await (prisma as any).product.findFirst({
      where: {
        id,
        tenantId: companyId,
      },
    });

    if (!existing) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Validate category if provided
    let categoryId: string | undefined = undefined;
    if (validated.categoryId) {
      const category = await (prisma as any).category.findFirst({
        where: {
          id: String(validated.categoryId),
          tenantId: companyId,
        },
      });
      if (!category) {
        throw new AppErrorClass('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
      categoryId = category.id;
    }

    const updateData: any = {};

    if (validated.name !== undefined) {
      updateData.name = validated.name;
    }

    if (validated.sellingPrice !== undefined || validated.basePrice !== undefined) {
      updateData.price = validated.sellingPrice || validated.basePrice;
    }

    if (validated.costPrice !== undefined) {
      updateData.cost = validated.costPrice;
    }

    // isActive might not be in validation schema, but we can still update it if provided
    if ((validated as any).isActive !== undefined) {
      updateData.isActive = (validated as any).isActive;
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    const product = await (prisma as any).product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return product;
  }

  async delete(companyId: string, id: string) {
    // Hard delete (schema doesn't have deletedAt)
    const product = await (prisma as any).product.findFirst({
      where: {
        id,
        tenantId: companyId,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    await (prisma as any).product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Find product by barcode or SKU
   * Used for barcode scanning functionality
   */
  async findByBarcode(companyId: string, barcode: string) {
    if (!barcode || barcode.trim() === '') {
      throw new AppErrorClass('Barcode is required', 400, 'BARCODE_REQUIRED');
    }

    const product = await (prisma as any).product.findFirst({
      where: {
        tenantId: companyId,
        OR: [
          { barcode: { equals: barcode.trim(), mode: 'insensitive' } },
          { sku: { equals: barcode.trim(), mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: {
        category: true,
        brand: true,
        unit: true,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found with this barcode', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }
}

export default new ProductService();

