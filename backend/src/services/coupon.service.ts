import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const couponCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().optional(),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  discount: z.coerce.number().min(0, 'Discount must be positive'),
  limit: z.coerce.number().int().min(0).default(0), // 0 = unlimited
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  isAllProducts: z.boolean().optional().default(true),
  oncePerCustomer: z.boolean().optional().default(false),
  productIds: z.array(z.string().uuid()).optional(),
});

export const couponUpdateSchema = couponCreateSchema.partial().omit({ code: true });

export class CouponService {
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Transform for frontend (matches CouponData.js structure)
  private transformCoupon(coupon: any): any {
    const validDate = coupon.validTo ? this.formatDate(coupon.validTo) : '';
    const discountDisplay = coupon.type === 'PERCENTAGE' 
      ? `${coupon.discount}%` 
      : `$${coupon.discount}`;
    
    return {
      id: coupon.id,
      Name: coupon.name,
      Code: coupon.code,
      Description: coupon.description || '',
      Type: coupon.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount',
      Discount: discountDisplay,
      Limit: coupon.limit === 0 ? 'Unlimited' : String(coupon.limit),
      Valid: validDate,
      Status: coupon.status === 'ACTIVE' ? 'Active' : 'Inactive',
      // Raw values
      _type: coupon.type,
      _discount: Number(coupon.discount),
      _limit: coupon.limit,
      _validFrom: coupon.validFrom,
      _validTo: coupon.validTo,
      _isAllProducts: coupon.isAllProducts,
      _oncePerCustomer: coupon.oncePerCustomer,
    };
  }

  /**
   * Get all coupons
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      type?: string;
      status?: string;
      search?: string;
    }
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.type) {
      where.type = filters.type.toUpperCase();
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          products: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      data: coupons.map(coupon => this.transformCoupon(coupon)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single coupon
   */
  async findOne(tenantId: string, id: string) {
    const coupon = await prisma.coupon.findFirst({
      where: { id, tenantId },
      include: {
        products: true,
      },
    });

    if (!coupon) {
      throw new AppErrorClass('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }

    return this.transformCoupon(coupon);
  }

  /**
   * Create coupon
   */
  async create(tenantId: string, data: z.infer<typeof couponCreateSchema>) {
    const validated = couponCreateSchema.parse(data);

    // Check if code already exists
    const existing = await prisma.coupon.findFirst({
      where: { tenantId, code: validated.code },
    });

    if (existing) {
      throw new AppErrorClass('Coupon code already exists', 400, 'CODE_EXISTS');
    }

    // Validate dates
    const validFrom = new Date(validated.validFrom);
    const validTo = new Date(validated.validTo);
    if (validTo <= validFrom) {
      throw new AppErrorClass('Valid to date must be after valid from date', 400, 'INVALID_DATES');
    }

    // Validate discount based on type
    if (validated.type === 'PERCENTAGE' && validated.discount > 100) {
      throw new AppErrorClass('Percentage discount cannot exceed 100%', 400, 'INVALID_DISCOUNT');
    }

    const coupon = await prisma.coupon.create({
      data: {
        tenantId,
        name: validated.name,
        code: validated.code,
        description: validated.description,
        type: validated.type,
        discount: validated.discount,
        limit: validated.limit,
        validFrom,
        validTo,
        status: validated.status || 'ACTIVE',
        isAllProducts: validated.isAllProducts ?? true,
        oncePerCustomer: validated.oncePerCustomer ?? false,
        products: validated.productIds && validated.productIds.length > 0 ? {
          create: validated.productIds.map(productId => ({ productId })),
        } : undefined,
      },
      include: {
        products: true,
      },
    });

    return this.transformCoupon(coupon);
  }

  /**
   * Update coupon
   */
  async update(tenantId: string, id: string, data: z.infer<typeof couponUpdateSchema>) {
    const validated = couponUpdateSchema.parse(data);

    const existing = await prisma.coupon.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }

    // Validate dates if provided
    if (validated.validFrom && validated.validTo) {
      const validFrom = new Date(validated.validFrom);
      const validTo = new Date(validated.validTo);
      if (validTo <= validFrom) {
        throw new AppErrorClass('Valid to date must be after valid from date', 400, 'INVALID_DATES');
      }
    }

    // Validate discount if type and discount are provided
    if (validated.type && validated.discount !== undefined) {
      if (validated.type === 'PERCENTAGE' && validated.discount > 100) {
        throw new AppErrorClass('Percentage discount cannot exceed 100%', 400, 'INVALID_DISCOUNT');
      }
    }

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.type) updateData.type = validated.type;
    if (validated.discount !== undefined) updateData.discount = validated.discount;
    if (validated.limit !== undefined) updateData.limit = validated.limit;
    if (validated.validFrom) updateData.validFrom = new Date(validated.validFrom);
    if (validated.validTo) updateData.validTo = new Date(validated.validTo);
    if (validated.status) updateData.status = validated.status;
    if (validated.isAllProducts !== undefined) updateData.isAllProducts = validated.isAllProducts;
    if (validated.oncePerCustomer !== undefined) updateData.oncePerCustomer = validated.oncePerCustomer;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        products: true,
      },
    });

    // Update products if provided
    if (validated.productIds !== undefined) {
      // Delete existing products
      await prisma.couponProduct.deleteMany({
        where: { couponId: id },
      });

      // Add new products
      if (validated.productIds.length > 0) {
        await prisma.couponProduct.createMany({
          data: validated.productIds.map(productId => ({
            couponId: id,
            productId,
          })),
        });
      }
    }

    return this.transformCoupon(coupon);
  }

  /**
   * Delete coupon
   */
  async delete(tenantId: string, id: string) {
    const existing = await prisma.coupon.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }

    await prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted successfully' };
  }

  /**
   * Validate coupon code
   */
  async validateCode(tenantId: string, code: string, customerId?: string) {
    const coupon = await prisma.coupon.findFirst({
      where: { tenantId, code, status: 'ACTIVE' },
      include: {
        products: true,
      },
    });

    if (!coupon) {
      throw new AppErrorClass('Invalid coupon code', 404, 'INVALID_COUPON');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      throw new AppErrorClass('Coupon has expired', 400, 'COUPON_EXPIRED');
    }

    // Check usage limit if applicable
    if (coupon.limit > 0) {
      // TODO: Implement usage tracking
      // const usageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
      // if (usageCount >= coupon.limit) {
      //   throw new AppErrorClass('Coupon usage limit reached', 400, 'LIMIT_REACHED');
      // }
    }

    return {
      valid: true,
      coupon: this.transformCoupon(coupon),
    };
  }
}

export default new CouponService();

