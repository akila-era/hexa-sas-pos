import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  LowStockQueryInput,
  ExpiredProductsQueryInput,
} from '../validators/product.validators';

export const productService = {
  async findAll(query: ProductQueryInput) {
    const {
      page,
      limit,
      search,
      categoryId,
      brandId,
      unitId,
      isActive,
      isFeatured,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Soft delete filter
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (unitId) where.unitId = unitId;
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.sellingPrice = {};
      if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
      if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          unit: { select: { id: true, name: true, shortName: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: { select: { variants: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  },

  async findById(id: number) {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        unit: { select: { id: true, name: true, shortName: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  },

  async create(data: CreateProductInput) {
    const { images, ...productData } = data;

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw new AppError('SKU already exists', 409);
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new AppError('Category not found', 404);
    }

    // Validate brand if provided
    if (data.brandId) {
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
      if (!brand) throw new AppError('Brand not found', 404);
    }

    // Validate unit if provided
    if (data.unitId) {
      const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
      if (!unit) throw new AppError('Unit not found', 404);
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        images: images && images.length > 0
          ? { create: images }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        unit: { select: { id: true, name: true, shortName: true } },
        images: true,
      },
    });

    return product;
  },

  async update(id: number, data: UpdateProductInput) {
    const { images, ...productData } = data;

    // Check if product exists
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) {
        throw new AppError('SKU already exists', 409);
      }
    }

    // Validate relations if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new AppError('Category not found', 404);
    }

    if (data.brandId) {
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
      if (!brand) throw new AppError('Brand not found', 404);
    }

    if (data.unitId) {
      const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
      if (!unit) throw new AppError('Unit not found', 404);
    }

    // Update product with optional image replacement
    const product = await prisma.$transaction(async (tx) => {
      // If images are provided, replace all images
      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({ ...img, productId: id })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: productData,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          unit: { select: { id: true, name: true, shortName: true } },
          images: true,
        },
      });
    });

    return product;
  },

  async delete(id: number) {
    // Check if product exists
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Product deleted successfully' };
  },

  async getLowStock(query: LowStockQueryInput) {
    const { page, limit, threshold } = query;
    const skip = (page - 1) * limit;

    // Get products where current stock <= min stock level (or custom threshold)
    const where: any = {
      deletedAt: null,
      isActive: true,
    };

    if (threshold !== undefined) {
      where.currentStock = { lte: threshold };
    } else {
      // Use each product's own minStockLevel
      where.AND = [
        { currentStock: { lte: prisma.product.fields.minStockLevel } },
      ];
    }

    // Using raw query for comparing columns
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          deletedAt: null,
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: { currentStock: 'asc' },
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true, shortName: true } },
        },
      }),
      prisma.product.count({
        where: {
          deletedAt: null,
          isActive: true,
        },
      }),
    ]);

    // Filter in application for column comparison
    const lowStockProducts = products.filter(
      (p) => p.currentStock <= (threshold ?? p.minStockLevel)
    );

    return {
      products: lowStockProducts.slice(0, limit),
      total: lowStockProducts.length,
      page,
      limit,
    };
  },

  async getExpired(query: ExpiredProductsQueryInput) {
    const { page, limit, includeSoonExpiring, daysUntilExpiry } = query;
    const skip = (page - 1) * limit;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      deletedAt: null,
      isActive: true,
      expiryDate: { not: null },
    };

    if (includeSoonExpiring) {
      // Include products expiring within X days
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + daysUntilExpiry);
      where.expiryDate = { lte: futureDate };
    } else {
      // Only expired products
      where.expiryDate = { lt: today };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expiryDate: 'asc' },
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true, shortName: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Add expiry status
    const productsWithStatus = products.map((p) => ({
      ...p,
      expiryStatus: p.expiryDate && p.expiryDate < today ? 'expired' : 'expiring_soon',
      daysUntilExpiry: p.expiryDate
        ? Math.ceil((p.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    return { products: productsWithStatus, total, page, limit };
  },
};

