import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const purchaseReturnCreateSchema = z.object({
  purchaseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
  })).min(1),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const purchaseReturnUpdateSchema = purchaseReturnCreateSchema.partial().omit({ purchaseId: true });

export class PurchaseReturnService {
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
    const count = await (prisma as any).purchaseReturn.count({ where: { tenantId } });
    return `PR${String(count + 1).padStart(4, '0')}`;
  }

  // Transform for frontend
  private transformReturn(pr: any): any {
    const product = pr.items?.[0]?.product;
    return {
      id: pr.id,
      img: product?.image || '',
      date: this.formatDate(pr.createdAt),
      supplier: pr.supplier?.name || 'N/A',
      reference: pr.returnNumber || '',
      status: pr.status === 'COMPLETED' ? 'Received' : 'Pending',
      grandTotal: Number(pr.total).toFixed(0),
      paid: Number(pr.total).toFixed(0), // Assuming refund equals total
      due: '0',
      paymentStatus: 'Paid',
      returnNumber: pr.returnNumber,
      reason: pr.reason,
      // Relations
      supplierData: pr.supplier,
      purchase: pr.purchase,
      items: pr.items,
    };
  }

  /**
   * Get all purchase returns
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      supplierId?: string;
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

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.search) {
      where.OR = [
        { returnNumber: { contains: filters.search, mode: 'insensitive' } },
        { supplier: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [returns, total] = await Promise.all([
      (prisma as any).purchaseReturn.findMany({
        where,
        include: {
          items: { include: { product: true } },
          supplier: true,
          purchase: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).purchaseReturn.count({ where }),
    ]);

    return {
      data: returns.map((pr: any) => this.transformReturn(pr)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single purchase return
   */
  async findOne(tenantId: string, id: string) {
    const pr = await (prisma as any).purchaseReturn.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        supplier: true,
        purchase: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!pr) {
      throw new AppErrorClass('Purchase return not found', 404, 'RETURN_NOT_FOUND');
    }

    return this.transformReturn(pr);
  }

  /**
   * Create purchase return
   */
  async create(tenantId: string, userId: string, data: z.infer<typeof purchaseReturnCreateSchema>) {
    const validated = purchaseReturnCreateSchema.parse(data);
    const returnNumber = await this.generateReturnNumber(tenantId);

    // Verify purchase exists
    const purchase = await (prisma as any).purchase.findFirst({
      where: { id: validated.purchaseId, tenantId },
      include: { warehouse: true },
    });

    if (!purchase) {
      throw new AppErrorClass('Purchase not found', 404, 'PURCHASE_NOT_FOUND');
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

    const pr = await (prisma as any).purchaseReturn.create({
      data: {
        tenantId,
        purchaseId: validated.purchaseId,
        supplierId: validated.supplierId,
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
        supplier: true,
        purchase: true,
      },
    });

    // Update stock (remove items from inventory)
    for (const item of itemsWithTotal) {
      const stock = await (prisma as any).stock.findFirst({
        where: {
          productId: item.productId,
          warehouseId: purchase.warehouseId,
        },
      });

      if (stock) {
        await (prisma as any).stock.update({
          where: { id: stock.id },
          data: { quantity: Math.max(0, stock.quantity - item.qty) },
        });
      }

      // Create stock movement
      await (prisma as any).stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: purchase.warehouseId,
          type: 'OUT',
          quantity: item.qty,
          refType: 'RETURN',
          refId: pr.id,
        },
      });
    }

    // Update supplier balance (reduce what we owe)
    await (prisma as any).supplier.update({
      where: { id: validated.supplierId },
      data: { balance: { decrement: total } },
    });

    return this.transformReturn(pr);
  }

  /**
   * Update purchase return
   */
  async update(tenantId: string, id: string, data: z.infer<typeof purchaseReturnUpdateSchema>) {
    const validated = purchaseReturnUpdateSchema.parse(data);

    const existing = await (prisma as any).purchaseReturn.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Purchase return not found', 404, 'RETURN_NOT_FOUND');
    }

    const updateData: any = {};
    if (validated.reason !== undefined) updateData.reason = validated.reason;
    if (validated.supplierId) updateData.supplierId = validated.supplierId;

    const pr = await (prisma as any).purchaseReturn.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        supplier: true,
        purchase: true,
      },
    });

    return this.transformReturn(pr);
  }

  /**
   * Delete purchase return
   */
  async delete(tenantId: string, id: string) {
    const existing = await (prisma as any).purchaseReturn.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Purchase return not found', 404, 'RETURN_NOT_FOUND');
    }

    await (prisma as any).purchaseReturn.delete({ where: { id } });
    return { message: 'Purchase return deleted successfully' };
  }
}

export default new PurchaseReturnService();

