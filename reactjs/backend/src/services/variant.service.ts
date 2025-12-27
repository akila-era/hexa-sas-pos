import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateVariantInput, UpdateVariantInput, VariantQueryInput } from '../validators/variant.validators';

export const variantService = {
  async findAll(query: VariantQueryInput) {
    const { page, limit, productId, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        { variantName: { contains: search, mode: 'insensitive' } },
        { variantValue: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, sellingPrice: true },
          },
        },
      }),
      prisma.productVariant.count({ where }),
    ]);

    // Calculate effective price for each variant
    const variantsWithPrice = variants.map((v) => ({
      ...v,
      effectivePrice: v.product.sellingPrice.toNumber() + v.priceAdjustment.toNumber(),
    }));

    return { variants: variantsWithPrice, total, page, limit };
  },

  async findById(id: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, name: true, sku: true, sellingPrice: true },
        },
      },
    });

    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    return {
      ...variant,
      effectivePrice: variant.product.sellingPrice.toNumber() + variant.priceAdjustment.toNumber(),
    };
  },

  async create(data: CreateVariantInput) {
    // Validate product exists
    const product = await prisma.product.findFirst({
      where: { id: data.productId, deletedAt: null },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check for duplicate variant (same name and value for same product)
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        productId: data.productId,
        variantName: data.variantName,
        variantValue: data.variantValue,
      },
    });

    if (existingVariant) {
      throw new AppError('This variant already exists for the product', 409);
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: data.productId,
        variantName: data.variantName,
        variantValue: data.variantValue,
        sku: data.sku,
        priceAdjustment: data.priceAdjustment ?? 0,
        stockQuantity: data.stockQuantity ?? 0,
        isActive: data.isActive ?? true,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, sellingPrice: true },
        },
      },
    });

    return {
      ...variant,
      effectivePrice: variant.product.sellingPrice.toNumber() + variant.priceAdjustment.toNumber(),
    };
  },

  async update(id: number, data: UpdateVariantInput) {
    // Check if variant exists
    const existing = await prisma.productVariant.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!existing) {
      throw new AppError('Variant not found', 404);
    }

    // Check for duplicate if name or value is changing
    if (data.variantName || data.variantValue) {
      const duplicateCheck = await prisma.productVariant.findFirst({
        where: {
          productId: existing.productId,
          variantName: data.variantName || existing.variantName,
          variantValue: data.variantValue || existing.variantValue,
          id: { not: id },
        },
      });

      if (duplicateCheck) {
        throw new AppError('This variant already exists for the product', 409);
      }
    }

    const variant = await prisma.productVariant.update({
      where: { id },
      data,
      include: {
        product: {
          select: { id: true, name: true, sku: true, sellingPrice: true },
        },
      },
    });

    return {
      ...variant,
      effectivePrice: variant.product.sellingPrice.toNumber() + variant.priceAdjustment.toNumber(),
    };
  },

  async delete(id: number) {
    // Check if variant exists
    const existing = await prisma.productVariant.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Variant not found', 404);
    }

    await prisma.productVariant.delete({ where: { id } });

    return { message: 'Variant deleted successfully' };
  },
};

