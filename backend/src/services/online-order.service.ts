import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const onlineOrderCreateSchema = z.object({
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
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']).optional(),
  note: z.string().optional(),
});

export const onlineOrderUpdateSchema = onlineOrderCreateSchema.partial();

export const paymentCreateSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export class OnlineOrderService {
  // Format date for frontend
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Generate order reference
  private async generateReference(tenantId: string): Promise<string> {
    const count = await (prisma as any).pOSOrder.count({ 
      where: { 
        tenantId,
        payment: 'ONLINE' // Filter for online orders only
      } 
    });
    return `SL${String(count + 1).padStart(3, '0')}`;
  }

  // Transform for frontend (matches onlineOrderData.jsx structure)
  private transformOrder(order: any): any {
    const sale = order.sale;
    return {
      id: order.id,
      customer: order.customer?.name || sale?.customer?.name || 'Walk-in Customer',
      image: order.customer?.avatar || sale?.customer?.avatar || 'src/assets/img/users/user-27.jpg',
      reference: order.orderNumber || `SL${order.id.slice(0, 3).toUpperCase()}`,
      date: this.formatDate(order.createdAt),
      status: order.status === 'COMPLETED' ? 'Completed' : 'Pending',
      total: `$${Number(order.total).toFixed(0)}`,
      paid: `$${Number(order.paidAmount).toFixed(0)}`,
      due: `$${Math.max(0, Number(order.total) - Number(order.paidAmount)).toFixed(2)}`,
      paymentstatus: Number(order.total) <= Number(order.paidAmount) ? 'Paid' : 
                     Number(order.paidAmount) === 0 ? 'Unpaid' : 'Overdue',
      biller: order.cashier?.firstName || order.cashier?.email || 'Admin',
      action: '',
      // Raw values
      _total: Number(order.total),
      _paid: Number(order.paidAmount),
      _due: Math.max(0, Number(order.total) - Number(order.paidAmount)),
      // Relations
      customerData: order.customer || sale?.customer,
      items: order.items,
      sale: sale,
    };
  }

  /**
   * Get all online orders
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
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
      payment: 'ONLINE', // Filter for online orders
    };

    if (filters.customerId) {
      where.OR = [
        { customerId: filters.customerId },
        { sale: { customerId: filters.customerId } },
      ];
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
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [orders, total] = await Promise.all([
      (prisma as any).pOSOrder.findMany({
        where,
        include: {
          items: { include: { product: true } },
          cashier: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          sale: {
            include: {
              customer: true,
              payments: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).pOSOrder.count({ where }),
    ]);

    return {
      data: orders.map((order: any) => this.transformOrder(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single online order
   */
  async findOne(tenantId: string, id: string) {
    const order = await (prisma as any).pOSOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        cashier: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        branch: true,
        sale: {
          include: {
            customer: true,
            items: { include: { product: true } },
            payments: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppErrorClass('Online order not found', 404, 'ORDER_NOT_FOUND');
    }

    return this.transformOrder(order);
  }

  /**
   * Create online order
   */
  async create(tenantId: string, userId: string, data: z.infer<typeof onlineOrderCreateSchema>) {
    const validated = onlineOrderCreateSchema.parse(data);
    const orderNumber = await this.generateReference(tenantId);

    // Calculate totals
    let subtotal = 0;
    const itemsWithTotal = validated.items.map(item => {
      const itemTotal = (item.price * item.qty) - (item.discount || 0);
      subtotal += itemTotal;
      return { ...item, total: itemTotal };
    });

    const discount = validated.discount || 0;
    const taxAmount = validated.taxAmount || 0;
    const shippingCost = validated.shippingCost || 0;
    const total = subtotal - discount + taxAmount + shippingCost;
    const paidAmount = validated.paidAmount || 0;

    // Create POS order with ONLINE payment type
    const order = await (prisma as any).pOSOrder.create({
      data: {
        tenantId,
        branchId: validated.branchId,
        cashierId: userId,
        customerId: validated.customerId,
        orderNumber,
        subtotal,
        taxAmount,
        discount,
        total,
        paidAmount,
        changeAmount: paidAmount > total ? paidAmount - total : 0,
        payment: 'ONLINE', // Mark as online order
        status: validated.status || 'PENDING',
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
        cashier: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Create linked Sale record
    const invoiceNumber = `INV${orderNumber}`;
    const dueAmount = total - paidAmount;

    await (prisma as any).sale.create({
      data: {
        tenantId,
        branchId: validated.branchId,
        posOrderId: order.id,
        customerId: validated.customerId,
        creatorId: userId,
        invoiceNumber,
        subtotal,
        taxAmount,
        discount,
        total,
        paidAmount,
        dueAmount: dueAmount < 0 ? 0 : dueAmount,
        paymentStatus: dueAmount <= 0 ? 'PAID' : paidAmount === 0 ? 'UNPAID' : 'PARTIAL',
        status: validated.status || 'PENDING',
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

    return this.transformOrder(order);
  }

  /**
   * Update online order
   */
  async update(tenantId: string, id: string, data: z.infer<typeof onlineOrderUpdateSchema>) {
    const validated = onlineOrderUpdateSchema.parse(data);

    const existing = await (prisma as any).pOSOrder.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Online order not found', 404, 'ORDER_NOT_FOUND');
    }

    const updateData: any = {};
    if (validated.status) updateData.status = validated.status;
    if (validated.note !== undefined) updateData.note = validated.note;
    if (validated.customerId) updateData.customerId = validated.customerId;

    const order = await (prisma as any).pOSOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        cashier: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        sale: {
          include: {
            customer: true,
            payments: true,
          },
        },
      },
    });

    // Update linked sale status if order status changed
    if (validated.status && existing.sale) {
      await (prisma as any).sale.update({
        where: { posOrderId: id },
        data: { status: validated.status },
      });
    }

    return this.transformOrder(order);
  }

  /**
   * Delete online order
   */
  async delete(tenantId: string, id: string) {
    const existing = await (prisma as any).pOSOrder.findFirst({
      where: { id, tenantId },
      include: { sale: true },
    });

    if (!existing) {
      throw new AppErrorClass('Online order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Delete linked sale first
    if (existing.sale) {
      await (prisma as any).sale.delete({ where: { id: existing.sale.id } });
    }

    await (prisma as any).pOSOrder.delete({ where: { id } });
    return { message: 'Online order deleted successfully' };
  }

  /**
   * Get payments for an order
   */
  async getPayments(tenantId: string, orderId: string) {
    const order = await (prisma as any).pOSOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { sale: true },
    });

    if (!order) {
      throw new AppErrorClass('Online order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (!order.sale) {
      return [];
    }

    const payments = await (prisma as any).salePayment.findMany({
      where: { saleId: order.sale.id },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment: any) => ({
      id: payment.id,
      date: this.formatDate(payment.createdAt),
      reference: payment.reference || `INV/${order.orderNumber}`,
      amount: `$${Number(payment.amount).toFixed(0)}`,
      paidBy: payment.paymentMethod,
      _amount: Number(payment.amount),
    }));
  }

  /**
   * Create payment for an order
   */
  async createPayment(tenantId: string, orderId: string, data: z.infer<typeof paymentCreateSchema>) {
    const validated = paymentCreateSchema.parse(data);

    const order = await (prisma as any).pOSOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { sale: true },
    });

    if (!order) {
      throw new AppErrorClass('Online order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (!order.sale) {
      throw new AppErrorClass('No sale linked to this order', 400, 'NO_SALE_LINKED');
    }

    // Create payment
    const payment = await (prisma as any).salePayment.create({
      data: {
        saleId: order.sale.id,
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        reference: validated.reference,
        note: validated.note,
      },
    });

    // Update sale and order payment amounts
    const newPaidAmount = Number(order.sale.paidAmount) + validated.amount;
    const newDueAmount = Number(order.sale.total) - newPaidAmount;

    await (prisma as any).sale.update({
      where: { id: order.sale.id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
        paymentStatus: newDueAmount <= 0 ? 'PAID' : 'PARTIAL',
      },
    });

    await (prisma as any).pOSOrder.update({
      where: { id: orderId },
      data: { paidAmount: newPaidAmount },
    });

    return {
      id: payment.id,
      date: this.formatDate(payment.createdAt),
      reference: payment.reference || `INV/${order.orderNumber}`,
      amount: `$${Number(payment.amount).toFixed(0)}`,
      paidBy: payment.paymentMethod,
    };
  }

  /**
   * Update payment
   */
  async updatePayment(tenantId: string, orderId: string, paymentId: string, data: z.infer<typeof paymentCreateSchema>) {
    const validated = paymentCreateSchema.parse(data);

    const order = await (prisma as any).pOSOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { sale: true },
    });

    if (!order || !order.sale) {
      throw new AppErrorClass('Order or sale not found', 404, 'NOT_FOUND');
    }

    const existingPayment = await (prisma as any).salePayment.findFirst({
      where: { id: paymentId, saleId: order.sale.id },
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

    // Recalculate totals
    const allPayments = await (prisma as any).salePayment.findMany({
      where: { saleId: order.sale.id },
    });
    const totalPaid = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const dueAmount = Number(order.sale.total) - totalPaid;

    await (prisma as any).sale.update({
      where: { id: order.sale.id },
      data: {
        paidAmount: totalPaid,
        dueAmount: dueAmount < 0 ? 0 : dueAmount,
        paymentStatus: dueAmount <= 0 ? 'PAID' : totalPaid === 0 ? 'UNPAID' : 'PARTIAL',
      },
    });

    await (prisma as any).pOSOrder.update({
      where: { id: orderId },
      data: { paidAmount: totalPaid },
    });

    return {
      id: payment.id,
      date: this.formatDate(payment.createdAt),
      reference: payment.reference,
      amount: `$${Number(payment.amount).toFixed(0)}`,
      paidBy: payment.paymentMethod,
    };
  }

  /**
   * Delete payment
   */
  async deletePayment(tenantId: string, orderId: string, paymentId: string) {
    const order = await (prisma as any).pOSOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { sale: true },
    });

    if (!order || !order.sale) {
      throw new AppErrorClass('Order or sale not found', 404, 'NOT_FOUND');
    }

    const payment = await (prisma as any).salePayment.findFirst({
      where: { id: paymentId, saleId: order.sale.id },
    });

    if (!payment) {
      throw new AppErrorClass('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    await (prisma as any).salePayment.delete({ where: { id: paymentId } });

    // Recalculate totals
    const allPayments = await (prisma as any).salePayment.findMany({
      where: { saleId: order.sale.id },
    });
    const totalPaid = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const dueAmount = Number(order.sale.total) - totalPaid;

    await (prisma as any).sale.update({
      where: { id: order.sale.id },
      data: {
        paidAmount: totalPaid,
        dueAmount: dueAmount < 0 ? 0 : dueAmount,
        paymentStatus: dueAmount <= 0 && totalPaid > 0 ? 'PAID' : totalPaid === 0 ? 'UNPAID' : 'PARTIAL',
      },
    });

    await (prisma as any).pOSOrder.update({
      where: { id: orderId },
      data: { paidAmount: totalPaid },
    });

    return { message: 'Payment deleted successfully' };
  }
}

export default new OnlineOrderService();

