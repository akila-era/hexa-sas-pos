import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const discountPlanCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  customerGroup: z.string().min(1, 'Customer group is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export const discountPlanUpdateSchema = discountPlanCreateSchema.partial();

export class DiscountPlanService {
  // Transform for frontend (matches discountPlanData.js structure)
  private transformDiscountPlan(plan: any): any {
    return {
      id: plan.id,
      PlanName: plan.name,
      Customers: plan.customerGroup,
      Status: plan.status === 'ACTIVE' ? 'Active' : 'Inactive',
      // Raw values
      _status: plan.status,
    };
  }

  /**
   * Get all discount plans
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      status?: string;
      search?: string;
    }
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { customerGroup: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [plans, total] = await Promise.all([
      prisma.discountPlan.findMany({
        where,
        include: {
          discounts: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.discountPlan.count({ where }),
    ]);

    return {
      data: plans.map(plan => this.transformDiscountPlan(plan)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single discount plan
   */
  async findOne(tenantId: string, id: string) {
    const plan = await prisma.discountPlan.findFirst({
      where: { id, tenantId },
      include: {
        discounts: true,
      },
    });

    if (!plan) {
      throw new AppErrorClass('Discount plan not found', 404, 'DISCOUNT_PLAN_NOT_FOUND');
    }

    return this.transformDiscountPlan(plan);
  }

  /**
   * Create discount plan
   */
  async create(tenantId: string, data: z.infer<typeof discountPlanCreateSchema>) {
    const validated = discountPlanCreateSchema.parse(data);

    // Check if name already exists
    const existing = await prisma.discountPlan.findFirst({
      where: { tenantId, name: validated.name },
    });

    if (existing) {
      throw new AppErrorClass('Discount plan name already exists', 400, 'NAME_EXISTS');
    }

    const plan = await prisma.discountPlan.create({
      data: {
        tenantId,
        name: validated.name,
        customerGroup: validated.customerGroup,
        status: validated.status || 'ACTIVE',
      },
    });

    return this.transformDiscountPlan(plan);
  }

  /**
   * Update discount plan
   */
  async update(tenantId: string, id: string, data: z.infer<typeof discountPlanUpdateSchema>) {
    const validated = discountPlanUpdateSchema.parse(data);

    const existing = await prisma.discountPlan.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Discount plan not found', 404, 'DISCOUNT_PLAN_NOT_FOUND');
    }

    // Check if new name already exists
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.discountPlan.findFirst({
        where: { tenantId, name: validated.name },
      });

      if (nameExists) {
        throw new AppErrorClass('Discount plan name already exists', 400, 'NAME_EXISTS');
      }
    }

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.customerGroup) updateData.customerGroup = validated.customerGroup;
    if (validated.status) updateData.status = validated.status;

    const plan = await prisma.discountPlan.update({
      where: { id },
      data: updateData,
    });

    return this.transformDiscountPlan(plan);
  }

  /**
   * Delete discount plan
   */
  async delete(tenantId: string, id: string) {
    const existing = await prisma.discountPlan.findFirst({
      where: { id, tenantId },
      include: {
        discounts: true,
      },
    });

    if (!existing) {
      throw new AppErrorClass('Discount plan not found', 404, 'DISCOUNT_PLAN_NOT_FOUND');
    }

    // Check if plan has discounts
    if (existing.discounts.length > 0) {
      throw new AppErrorClass('Cannot delete discount plan with associated discounts', 400, 'HAS_DISCOUNTS');
    }

    await prisma.discountPlan.delete({ where: { id } });
    return { message: 'Discount plan deleted successfully' };
  }
}

export default new DiscountPlanService();

