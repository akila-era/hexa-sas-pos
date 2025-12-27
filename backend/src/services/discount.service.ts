import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const discountCreateSchema = z.object({
  discountPlanId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255),
  value: z.coerce.number().min(0, 'Value must be positive'),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  validityStart: z.string().datetime(),
  validityEnd: z.string().datetime(),
  days: z.string().optional(), // Comma-separated: Mon,Tue,Wed,Thu,Fri,Sat,Sun
  isAllProducts: z.boolean().optional().default(true),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'REDEEMED']).optional().default('ACTIVE'),
  productIds: z.array(z.string().uuid()).optional(),
});

export const discountUpdateSchema = discountCreateSchema.partial().omit({ discountPlanId: true });

export class DiscountService {
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Transform for frontend (matches discountData.js structure)
  private transformDiscount(discount: any): any {
    const validityStart = this.formatDate(discount.validityStart);
    const validityEnd = this.formatDate(discount.validityEnd);
    const validity = `${validityStart} - ${validityEnd}`;
    
    const valueDisplay = discount.type === 'PERCENTAGE' 
      ? `${discount.value} (Percentage)` 
      : `${discount.value} (Flat)`;

    let status = discount.status;
    // Check if expired
    const now = new Date();
    if (discount.validityEnd < now && status === 'ACTIVE') {
      status = 'EXPIRED';
    }

    return {
      id: discount.id,
      Name: discount.name,
      Value: valueDisplay,
      DiscountPlan: discount.discountPlan?.name || '',
      Valitidy: validity,
      Days: discount.days || 'All Days',
      Products: discount.isAllProducts ? 'All Products' : 'Specific Products',
      Status: status === 'ACTIVE' ? 'Active' : 
              status === 'REDEEMED' ? 'Redeemed' :
              status === 'EXPIRED' ? 'Expired' : 'Inactive',
      // Raw values
      _value: Number(discount.value),
      _type: discount.type,
      _validityStart: discount.validityStart,
      _validityEnd: discount.validityEnd,
      _days: discount.days,
      _isAllProducts: discount.isAllProducts,
      _status: status,
      discountPlan: discount.discountPlan,
    };
  }

  /**
   * Get all discounts
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      discountPlanId?: string;
      status?: string;
      search?: string;
    }
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.discountPlanId) {
      where.discountPlanId = filters.discountPlanId;
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        include: {
          discountPlan: true,
          products: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.discount.count({ where }),
    ]);

    return {
      data: discounts.map(discount => this.transformDiscount(discount)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single discount
   */
  async findOne(tenantId: string, id: string) {
    const discount = await prisma.discount.findFirst({
      where: { id, tenantId },
      include: {
        discountPlan: true,
        products: true,
      },
    });

    if (!discount) {
      throw new AppErrorClass('Discount not found', 404, 'DISCOUNT_NOT_FOUND');
    }

    return this.transformDiscount(discount);
  }

  /**
   * Create discount
   */
  async create(tenantId: string, data: z.infer<typeof discountCreateSchema>) {
    const validated = discountCreateSchema.parse(data);

    // Verify discount plan exists
    const plan = await prisma.discountPlan.findFirst({
      where: { id: validated.discountPlanId, tenantId },
    });

    if (!plan) {
      throw new AppErrorClass('Discount plan not found', 404, 'DISCOUNT_PLAN_NOT_FOUND');
    }

    // Validate dates
    const validityStart = new Date(validated.validityStart);
    const validityEnd = new Date(validated.validityEnd);
    if (validityEnd <= validityStart) {
      throw new AppErrorClass('Validity end date must be after start date', 400, 'INVALID_DATES');
    }

    // Validate value based on type
    if (validated.type === 'PERCENTAGE' && validated.value > 100) {
      throw new AppErrorClass('Percentage value cannot exceed 100%', 400, 'INVALID_VALUE');
    }

    const discount = await prisma.discount.create({
      data: {
        tenantId,
        discountPlanId: validated.discountPlanId,
        name: validated.name,
        value: validated.value,
        type: validated.type,
        validityStart,
        validityEnd,
        days: validated.days,
        isAllProducts: validated.isAllProducts ?? true,
        status: validated.status || 'ACTIVE',
        products: validated.productIds && validated.productIds.length > 0 ? {
          create: validated.productIds.map(productId => ({ productId })),
        } : undefined,
      },
      include: {
        discountPlan: true,
        products: true,
      },
    });

    return this.transformDiscount(discount);
  }

  /**
   * Update discount
   */
  async update(tenantId: string, id: string, data: z.infer<typeof discountUpdateSchema>) {
    const validated = discountUpdateSchema.parse(data);

    const existing = await prisma.discount.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Discount not found', 404, 'DISCOUNT_NOT_FOUND');
    }

    // Validate dates if provided
    if (validated.validityStart && validated.validityEnd) {
      const validityStart = new Date(validated.validityStart);
      const validityEnd = new Date(validated.validityEnd);
      if (validityEnd <= validityStart) {
        throw new AppErrorClass('Validity end date must be after start date', 400, 'INVALID_DATES');
      }
    }

    // Validate value if type and value are provided
    if (validated.type && validated.value !== undefined) {
      if (validated.type === 'PERCENTAGE' && validated.value > 100) {
        throw new AppErrorClass('Percentage value cannot exceed 100%', 400, 'INVALID_VALUE');
      }
    }

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.value !== undefined) updateData.value = validated.value;
    if (validated.type) updateData.type = validated.type;
    if (validated.validityStart) updateData.validityStart = new Date(validated.validityStart);
    if (validated.validityEnd) updateData.validityEnd = new Date(validated.validityEnd);
    if (validated.days !== undefined) updateData.days = validated.days;
    if (validated.isAllProducts !== undefined) updateData.isAllProducts = validated.isAllProducts;
    if (validated.status) updateData.status = validated.status;

    // Check expiry
    const now = new Date();
    if (updateData.validityEnd && new Date(updateData.validityEnd) < now) {
      updateData.status = 'EXPIRED';
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: updateData,
      include: {
        discountPlan: true,
        products: true,
      },
    });

    // Update products if provided
    if (validated.productIds !== undefined) {
      // Delete existing products
      await prisma.discountProduct.deleteMany({
        where: { discountId: id },
      });

      // Add new products
      if (validated.productIds.length > 0) {
        await prisma.discountProduct.createMany({
          data: validated.productIds.map(productId => ({
            discountId: id,
            productId,
          })),
        });
      }
    }

    return this.transformDiscount(discount);
  }

  /**
   * Delete discount
   */
  async delete(tenantId: string, id: string) {
    const existing = await prisma.discount.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Discount not found', 404, 'DISCOUNT_NOT_FOUND');
    }

    await prisma.discount.delete({ where: { id } });
    return { message: 'Discount deleted successfully' };
  }
}

export default new DiscountService();

