import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const salesReturnCreateSchema = z.object({
  saleId: z.string().uuid(),
  branchId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
  })).min(1),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const salesReturnUpdateSchema = salesReturnCreateSchema.partial().omit({ saleId: true });

export class SalesReturnService {
  // Format date for frontend
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Generate return number
  private async generateReturnNumber(tenantId: string): Promise<string> {
    const count = await (prisma as any).salesReturn.count({ where: { tenantId } });
    return `SR${String(count + 1).padStart(4, '0')}`;
  }

  // Transform for frontend
  private transformReturn(sr: any): any {
    const product = sr.items?.[0]?.product;
    return {
      id: sr.id,
      productname: product?.name || 'Multiple Products',
      img: product?.image || '',
      date: this.formatDate(sr.createdAt),
      customer: sr.customer?.name || 'Walk-in Customer',
      customer_image: sr.customer?.avatar || '',
      status: sr.status === 'COMPLETED' ? 'Received' : 'Pending',
      grandtotal: Number(sr.total).toFixed(0),
      paid: Number(sr.total).toFixed(0), // Assuming refund equals total
      due: '0',
      paymentstatus: 'Paid',
      returnNumber: sr.returnNumber,
      reason: sr.reason,
      // Relations
      customerData: sr.customer,
      sale: sr.sale,
      items: sr.items,
    };
  }

  /**
   * Get all sales returns
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      customerId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [returns, total] = await Promise.all([
      (prisma as any).salesReturn.findMany({
        where,
        include: {
          items: { include: { product: true } },
          customer: true,
          sale: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).salesReturn.count({ where }),
    ]);

    return {
      data: returns.map((sr: any) => this.transformReturn(sr)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single sales return
   */
  async findOne(tenantId: string, id: string) {
    const sr = await (prisma as any).salesReturn.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        customer: true,
        sale: {
          include: {
            items: { include: { product: true } },
          },
        },
        branch: true,
      },
    });

    if (!sr) {
      throw new AppErrorClass('Sales return not found', 404, 'RETURN_NOT_FOUND');
    }

    return this.transformReturn(sr);
  }

  /**
   * Create sales return
   */
  async create(tenantId: string, userId: string, data: z.infer<typeof salesReturnCreateSchema>) {
    const validated = salesReturnCreateSchema.parse(data);
    const returnNumber = await this.generateReturnNumber(tenantId);

    // Verify sale exists
    const sale = await (prisma as any).sale.findFirst({
      where: { id: validated.saleId, tenantId },
    });

    if (!sale) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    // Calculate totals
    let subtotal = 0;
    const itemsWithTotal = validated.items.map(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      return { ...item, total: itemTotal };
    });

    const taxAmount = subtotal * 0; // No tax on returns by default
    const total = subtotal + taxAmount;

    const sr = await (prisma as any).salesReturn.create({
      data: {
        tenantId,
        branchId: validated.branchId,
        saleId: validated.saleId,
        customerId: validated.customerId || sale.customerId,
        returnNumber,
        subtotal,
        taxAmount,
        total,
        reason: validated.reason,
        status: 'COMPLETED',
        createdBy: userId,
        items: {
          create: itemsWithTotal.map(item => ({
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            total: item.total,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        sale: true,
      },
    });

    // Update stock (return items back to inventory)
    for (const item of itemsWithTotal) {
      const stock = await (prisma as any).stock.findFirst({
        where: {
          productId: item.productId,
          warehouse: { branchId: validated.branchId },
        },
      });

      if (stock) {
        await (prisma as any).stock.update({
          where: { id: stock.id },
          data: { quantity: stock.quantity + item.qty },
        });
      }
    }

    return this.transformReturn(sr);
  }

  /**
   * Update sales return
   */
  async update(tenantId: string, id: string, data: z.infer<typeof salesReturnUpdateSchema>) {
    const validated = salesReturnUpdateSchema.parse(data);

    const existing = await (prisma as any).salesReturn.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Sales return not found', 404, 'RETURN_NOT_FOUND');
    }

    const updateData: any = {};
    if (validated.reason !== undefined) updateData.reason = validated.reason;
    if (validated.customerId) updateData.customerId = validated.customerId;

    const sr = await (prisma as any).salesReturn.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        customer: true,
        sale: true,
      },
    });

    return this.transformReturn(sr);
  }

  /**
   * Delete sales return
   */
  async delete(tenantId: string, id: string) {
    const existing = await (prisma as any).salesReturn.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Sales return not found', 404, 'RETURN_NOT_FOUND');
    }

    await (prisma as any).salesReturn.delete({ where: { id } });
    return { message: 'Sales return deleted successfully' };
  }
}

export default new SalesReturnService();

