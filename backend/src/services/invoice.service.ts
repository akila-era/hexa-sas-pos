import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const invoiceCreateSchema = z.object({
  customerId: z.string().uuid().optional(),
  saleId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
  })).min(1),
  discount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  note: z.string().optional(),
  terms: z.string().optional(),
});

export const invoiceUpdateSchema = invoiceCreateSchema.partial();

export const invoicePaymentSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export class InvoiceService {
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
    const count = await (prisma as any).invoice.count({ where: { tenantId } });
    return `INV${String(count + 1).padStart(4, '0')}`;
  }

  // Transform for frontend
  private transformInvoice(inv: any): any {
    return {
      id: inv.id,
      invoiceno: inv.invoiceNumber || `INV${inv.id.slice(0, 4).toUpperCase()}`,
      customer: inv.customer?.name || 'Walk-in Customer',
      image: inv.customer?.avatar || 'src/assets/img/users/user-27.jpg',
      duedate: inv.dueDate ? this.formatDate(inv.dueDate) : '-',
      amount: `$${Number(inv.total).toFixed(0)}`,
      paid: `$${Number(inv.paidAmount).toFixed(0)}`,
      amountdue: `$${Number(inv.dueAmount).toFixed(0)}`,
      status: Number(inv.dueAmount) === 0 ? 'Paid' : 
              (inv.dueDate && new Date(inv.dueDate) < new Date()) ? 'Overdue' : 'Unpaid',
      // Raw values
      _total: Number(inv.total),
      _paidAmount: Number(inv.paidAmount),
      _dueAmount: Number(inv.dueAmount),
      // Relations
      customerData: inv.customer,
      items: inv.items,
      payments: inv.payments,
    };
  }

  /**
   * Get all invoices
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
      if (filters.status.toLowerCase() === 'overdue') {
        where.dueDate = { lt: new Date() };
        where.dueAmount = { gt: 0 };
      } else {
        where.status = filters.status.toUpperCase();
      }
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
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

    const [invoices, total] = await Promise.all([
      (prisma as any).invoice.findMany({
        where,
        include: {
          items: { include: { product: true } },
          customer: true,
          payments: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv: any) => this.transformInvoice(inv)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get overdue invoices
   */
  async getOverdue(
    tenantId: string,
    filters: z.infer<typeof paginationSchema>
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit } = parsed;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      dueDate: { lt: new Date() },
      dueAmount: { gt: 0 },
    };

    const [invoices, total] = await Promise.all([
      (prisma as any).invoice.findMany({
        where,
        include: {
          items: { include: { product: true } },
          customer: true,
          payments: true,
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limit,
      }),
      (prisma as any).invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv: any) => this.transformInvoice(inv)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single invoice
   */
  async findOne(tenantId: string, id: string) {
    const invoice = await (prisma as any).invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        customer: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new AppErrorClass('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    return this.transformInvoice(invoice);
  }

  /**
   * Create invoice
   */
  async create(tenantId: string, userId: string, data: z.infer<typeof invoiceCreateSchema>) {
    const validated = invoiceCreateSchema.parse(data);
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Calculate totals
    let subtotal = 0;
    const itemsWithTotal = validated.items.map(item => {
      const itemTotal = (item.price * item.qty) - (item.discount || 0);
      subtotal += itemTotal;
      return { ...item, total: itemTotal };
    });

    const discount = validated.discount || 0;
    const taxAmount = validated.taxAmount || 0;
    const total = subtotal - discount + taxAmount;

    const invoice = await (prisma as any).invoice.create({
      data: {
        tenantId,
        customerId: validated.customerId,
        saleId: validated.saleId,
        invoiceNumber,
        subtotal,
        taxAmount,
        discount,
        total,
        paidAmount: 0,
        dueAmount: total,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        status: 'UNPAID',
        note: validated.note,
        terms: validated.terms,
        createdBy: userId,
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
        payments: true,
      },
    });

    return this.transformInvoice(invoice);
  }

  /**
   * Update invoice
   */
  async update(tenantId: string, id: string, data: z.infer<typeof invoiceUpdateSchema>) {
    const validated = invoiceUpdateSchema.parse(data);

    const existing = await (prisma as any).invoice.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    const updateData: any = {};
    if (validated.customerId) updateData.customerId = validated.customerId;
    if (validated.note !== undefined) updateData.note = validated.note;
    if (validated.terms !== undefined) updateData.terms = validated.terms;
    if (validated.dueDate) updateData.dueDate = new Date(validated.dueDate);

    // If items provided, recalculate
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
      updateData.dueAmount = dueAmount < 0 ? 0 : dueAmount;
      updateData.status = dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

      // Delete and recreate items
      await (prisma as any).invoiceItem.deleteMany({ where: { invoiceId: id } });
      await (prisma as any).invoiceItem.createMany({
        data: itemsWithTotal.map(item => ({
          invoiceId: id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.total,
        })),
      });
    }

    const invoice = await (prisma as any).invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        customer: true,
        payments: true,
      },
    });

    return this.transformInvoice(invoice);
  }

  /**
   * Add payment to invoice
   */
  async addPayment(tenantId: string, id: string, data: z.infer<typeof invoicePaymentSchema>) {
    const validated = invoicePaymentSchema.parse(data);

    const invoice = await (prisma as any).invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new AppErrorClass('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    // Create payment
    const payment = await (prisma as any).invoicePayment.create({
      data: {
        invoiceId: id,
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        reference: validated.reference,
        note: validated.note,
      },
    });

    // Update invoice amounts
    const newPaidAmount = Number(invoice.paidAmount) + validated.amount;
    const newDueAmount = Number(invoice.total) - newPaidAmount;

    await (prisma as any).invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
        status: newDueAmount <= 0 ? 'PAID' : 'PARTIAL',
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
   * Delete invoice
   */
  async delete(tenantId: string, id: string) {
    const existing = await (prisma as any).invoice.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    await (prisma as any).invoice.delete({ where: { id } });
    return { message: 'Invoice deleted successfully' };
  }
}

export default new InvoiceService();
