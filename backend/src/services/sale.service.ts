import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const saleCreateSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
  })).min(1),
  discount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']).optional(),
  note: z.string().optional(),
});

export const saleUpdateSchema = saleCreateSchema.partial();

export const paymentCreateSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export class SaleService {
  // Format date for frontend
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Generate invoice number
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await (prisma as any).sale.count({ where: { tenantId } });
    return `SL${String(count + 1).padStart(4, '0')}`;
  }

  // Transform sale for frontend
  private transformSale(sale: any): any {
    return {
      id: sale.id,
      customerName: sale.customer?.name || 'Walk-in Customer',
      reference: sale.invoiceNumber || `SL${sale.id.slice(0, 4).toUpperCase()}`,
      date: this.formatDate(sale.createdAt),
      status: sale.status === 'COMPLETED' ? 'Completed' : sale.status === 'PENDING' ? 'Pending' : 'Cancelled',
      grandTotal: `$${Number(sale.total).toFixed(2)}`,
      paid: `$${Number(sale.paidAmount).toFixed(2)}`,
      due: `$${Number(sale.dueAmount).toFixed(2)}`,
      paymentStatus: Number(sale.dueAmount) === 0 ? 'Paid' : Number(sale.paidAmount) === 0 ? 'Due' : 'Partial',
      biller: sale.creator?.firstName || sale.creator?.email || 'Admin',
      // Raw values
      _grandTotal: Number(sale.total),
      _paid: Number(sale.paidAmount),
      _due: Number(sale.dueAmount),
      // Relations
      customer: sale.customer,
      items: sale.items,
      payments: sale.payments,
      createdAt: sale.createdAt,
    };
  }

  /**
   * Get all sales with filters
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      branchId?: string;
      customerId?: string;
      status?: string;
      paymentStatus?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus.toUpperCase();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [sales, total] = await Promise.all([
      (prisma as any).sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payments: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).sale.count({ where }),
    ]);

    return {
      data: sales.map((sale: any) => this.transformSale(sale)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single sale by ID
   */
  async findOne(tenantId: string, id: string) {
    const sale = await (prisma as any).sale.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payments: true,
        branch: true,
        pos: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    return this.transformSale(sale);
  }

  /**
   * Create new sale
   */
  async create(tenantId: string, userId: string, data: z.infer<typeof saleCreateSchema>) {
    const validated = saleCreateSchema.parse(data);
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Calculate totals
    let subtotal = 0;
    const itemsWithTotal = validated.items.map(item => {
      const itemTotal = (item.price * item.qty) - (item.discount || 0);
      subtotal += itemTotal;
      return {
        ...item,
        total: itemTotal,
      };
    });

    const discount = validated.discount || 0;
    const taxAmount = validated.taxAmount || 0;
    const total = subtotal - discount + taxAmount;
    const paidAmount = validated.paidAmount || 0;
    const dueAmount = total - paidAmount;

    // First create a POS order
    const posOrder = await (prisma as any).pOSOrder.create({
      data: {
        tenantId,
        branchId: validated.branchId,
        cashierId: userId,
        customerId: validated.customerId,
        subtotal,
        taxAmount,
        discount,
        total,
        paidAmount,
        changeAmount: paidAmount > total ? paidAmount - total : 0,
        payment: validated.paymentMethod || 'CASH',
        status: 'COMPLETED',
        note: validated.note,
        items: {
          create: itemsWithTotal.map(item => ({
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: item.total,
          })),
        },
      },
    });

    // Then create sale linked to POS order
    const sale = await (prisma as any).sale.create({
      data: {
        tenantId,
        branchId: validated.branchId,
        posOrderId: posOrder.id,
        customerId: validated.customerId,
        creatorId: userId,
        invoiceNumber,
        subtotal,
        taxAmount,
        discount,
        total,
        paidAmount,
        dueAmount,
        paymentStatus: dueAmount === 0 ? 'PAID' : paidAmount === 0 ? 'UNPAID' : 'PARTIAL',
        status: validated.status || 'COMPLETED',
        note: validated.note,
        items: {
          create: itemsWithTotal.map(item => ({
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: item.total,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        creator: true,
        payments: true,
      },
    });

    // Create initial payment if paid
    if (paidAmount > 0) {
      await (prisma as any).salePayment.create({
        data: {
          saleId: sale.id,
          amount: paidAmount,
          paymentMethod: validated.paymentMethod || 'CASH',
        },
      });
    }

    return this.transformSale(sale);
  }

  /**
   * Update sale
   */
  async update(tenantId: string, id: string, data: z.infer<typeof saleUpdateSchema>) {
    const validated = saleUpdateSchema.parse(data);

    const existing = await (prisma as any).sale.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    // Update sale
    const updateData: any = {};
    if (validated.customerId) updateData.customerId = validated.customerId;
    if (validated.status) updateData.status = validated.status;
    if (validated.note !== undefined) updateData.note = validated.note;
    if (validated.discount !== undefined) updateData.discount = validated.discount;

    // If items are provided, update them
    if (validated.items && validated.items.length > 0) {
      let subtotal = 0;
      const itemsWithTotal = validated.items.map(item => {
        const itemTotal = (item.price * item.qty) - (item.discount || 0);
        subtotal += itemTotal;
        return { ...item, total: itemTotal };
      });

      const discount = validated.discount || Number(existing.discount);
      const taxAmount = validated.taxAmount || Number(existing.taxAmount);
      const total = subtotal - discount + taxAmount;
      const paidAmount = Number(existing.paidAmount);
      const dueAmount = total - paidAmount;

      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.discount = discount;
      updateData.total = total;
      updateData.dueAmount = dueAmount;
      updateData.paymentStatus = dueAmount === 0 ? 'PAID' : paidAmount === 0 ? 'UNPAID' : 'PARTIAL';

      // Delete existing items and create new ones
      await (prisma as any).saleItem.deleteMany({ where: { saleId: id } });
      await (prisma as any).saleItem.createMany({
        data: itemsWithTotal.map(item => ({
          saleId: id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.total,
        })),
      });
    }

    const sale = await (prisma as any).sale.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        customer: true,
        creator: true,
        payments: true,
      },
    });

    return this.transformSale(sale);
  }

  /**
   * Delete sale
   */
  async delete(tenantId: string, id: string) {
    const existing = await (prisma as any).sale.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    await (prisma as any).sale.delete({ where: { id } });
    return { message: 'Sale deleted successfully' };
  }

  /**
   * Get payments for a sale
   */
  async getPayments(tenantId: string, saleId: string) {
    const sale = await (prisma as any).sale.findFirst({
      where: { id: saleId, tenantId },
    });

    if (!sale) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    const payments = await (prisma as any).salePayment.findMany({
      where: { saleId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment: any) => ({
      id: payment.id,
      date: this.formatDate(payment.createdAt),
      reference: payment.reference || `PAY${payment.id.slice(0, 6).toUpperCase()}`,
      amount: `$${Number(payment.amount).toFixed(2)}`,
      paidBy: payment.paymentMethod,
      _amount: Number(payment.amount),
    }));
  }

  /**
   * Create payment for a sale
   */
  async createPayment(tenantId: string, saleId: string, data: z.infer<typeof paymentCreateSchema>) {
    const validated = paymentCreateSchema.parse(data);

    const sale = await (prisma as any).sale.findFirst({
      where: { id: saleId, tenantId },
    });

    if (!sale) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    // Create payment
    const payment = await (prisma as any).salePayment.create({
      data: {
        saleId,
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        reference: validated.reference,
        note: validated.note,
      },
    });

    // Update sale payment amounts
    const newPaidAmount = Number(sale.paidAmount) + validated.amount;
    const newDueAmount = Number(sale.total) - newPaidAmount;

    await (prisma as any).sale.update({
      where: { id: saleId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
        paymentStatus: newDueAmount <= 0 ? 'PAID' : 'PARTIAL',
      },
    });

    return {
      id: payment.id,
      date: this.formatDate(payment.createdAt),
      reference: payment.reference || `PAY${payment.id.slice(0, 6).toUpperCase()}`,
      amount: `$${Number(payment.amount).toFixed(2)}`,
      paidBy: payment.paymentMethod,
    };
  }

  /**
   * Update payment
   */
  async updatePayment(tenantId: string, saleId: string, paymentId: string, data: z.infer<typeof paymentCreateSchema>) {
    const validated = paymentCreateSchema.parse(data);

    const sale = await (prisma as any).sale.findFirst({
      where: { id: saleId, tenantId },
    });

    if (!sale) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    const existingPayment = await (prisma as any).salePayment.findFirst({
      where: { id: paymentId, saleId },
    });

    if (!existingPayment) {
      throw new AppErrorClass('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    const payment = await (prisma as any).salePayment.update({
      where: { id: paymentId },
      data: {
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        reference: validated.reference,
        note: validated.note,
      },
    });

    // Recalculate sale payment totals
    const allPayments = await (prisma as any).salePayment.findMany({
      where: { saleId },
    });
    const totalPaid = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const dueAmount = Number(sale.total) - totalPaid;

    await (prisma as any).sale.update({
      where: { id: saleId },
      data: {
        paidAmount: totalPaid,
        dueAmount: dueAmount < 0 ? 0 : dueAmount,
        paymentStatus: dueAmount <= 0 ? 'PAID' : totalPaid === 0 ? 'UNPAID' : 'PARTIAL',
      },
    });

    return {
      id: payment.id,
      date: this.formatDate(payment.createdAt),
      reference: payment.reference,
      amount: `$${Number(payment.amount).toFixed(2)}`,
      paidBy: payment.paymentMethod,
    };
  }

  /**
   * Delete payment
   */
  async deletePayment(tenantId: string, saleId: string, paymentId: string) {
    const sale = await (prisma as any).sale.findFirst({
      where: { id: saleId, tenantId },
    });

    if (!sale) {
      throw new AppErrorClass('Sale not found', 404, 'SALE_NOT_FOUND');
    }

    const payment = await (prisma as any).salePayment.findFirst({
      where: { id: paymentId, saleId },
    });

    if (!payment) {
      throw new AppErrorClass('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    await (prisma as any).salePayment.delete({ where: { id: paymentId } });

    // Recalculate sale payment totals
    const allPayments = await (prisma as any).salePayment.findMany({
      where: { saleId },
    });
    const totalPaid = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const dueAmount = Number(sale.total) - totalPaid;

    await (prisma as any).sale.update({
      where: { id: saleId },
      data: {
        paidAmount: totalPaid,
        dueAmount: dueAmount < 0 ? 0 : dueAmount,
        paymentStatus: dueAmount <= 0 && totalPaid > 0 ? 'PAID' : totalPaid === 0 ? 'UNPAID' : 'PARTIAL',
      },
    });

    return { message: 'Payment deleted successfully' };
  }
}

export default new SaleService();
