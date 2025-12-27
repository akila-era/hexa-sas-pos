import { prisma } from '../database/client';
import { AppError } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const orderCreateSchema = z.object({
  branchId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
  })).min(1),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  deliveryAddress: z.string().optional(),
  deliveryPhone: z.string().optional(),
  deliveryNotes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  note: z.string().optional(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  deliveryAddress: z.string().optional(),
  deliveryPhone: z.string().optional(),
  deliveryNotes: z.string().optional(),
  isDeliveryReady: z.boolean().optional(),
  cancelReason: z.string().optional(),
  note: z.string().optional(),
});

export const orderPaymentSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export class OmsService {
  // Format date for frontend
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Generate order number
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await prisma.order.count({ 
      where: { tenantId } 
    });
    return `ORD${String(count + 1).padStart(6, '0')}`;
  }

  // Transform order for frontend
  private transformOrder(order: any): any {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Walk-in Customer',
      customerId: order.customerId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      paidAmount: Number(order.paidAmount),
      dueAmount: Number(order.dueAmount),
      deliveryAddress: order.deliveryAddress,
      deliveryPhone: order.deliveryPhone,
      deliveryNotes: order.deliveryNotes,
      isDeliveryReady: order.isDeliveryReady,
      readyAt: order.readyAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancelReason: order.cancelReason,
      date: this.formatDate(order.createdAt),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      // Relations
      customer: order.customer,
      branch: order.branch,
      items: order.items,
      statusHistory: order.statusHistory,
    };
  }

  /**
   * Get all orders with filters
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
      isDeliveryReady?: boolean;
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

    if (filters.isDeliveryReady !== undefined) {
      where.isDeliveryReady = filters.isDeliveryReady;
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
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        { deliveryAddress: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          branch: true,
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // Last 10 status changes
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
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
   * Get single order by ID
   */
  async findOne(tenantId: string, id: string) {
    const order = await prisma.order.findFirst({
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
        branch: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    return this.transformOrder(order);
  }

  /**
   * Create new order
   */
  async create(tenantId: string, userId: string, data: z.infer<typeof orderCreateSchema>) {
    const validated = orderCreateSchema.parse(data);

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Calculate totals
    const subtotal = validated.subtotal || validated.items.reduce(
      (sum, item) => sum + (item.price * item.qty) - (item.discount || 0),
      0
    );
    const taxAmount = validated.taxAmount || validated.items.reduce(
      (sum, item) => sum + (item.tax || 0),
      0
    );
    const discount = validated.discount || 0;
    const shippingCost = validated.shippingCost || 0;
    const total = subtotal + taxAmount - discount + shippingCost;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        tenantId,
        branchId: validated.branchId,
        customerId: validated.customerId,
        orderNumber,
        status: validated.status || 'PENDING',
        subtotal,
        taxAmount,
        discount,
        shippingCost,
        total,
        paidAmount: 0,
        dueAmount: total,
        paymentStatus: 'UNPAID',
        deliveryAddress: validated.deliveryAddress,
        deliveryPhone: validated.deliveryPhone,
        deliveryNotes: validated.deliveryNotes,
        createdBy: userId,
        items: {
          create: validated.items.map((item) => ({
            productId: item.productId,
            productName: '', // Will be populated from product relation
            qty: item.qty,
            price: item.price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: (item.price * item.qty) - (item.discount || 0) + (item.tax || 0),
          })),
        },
        statusHistory: {
          create: {
            status: validated.status || 'PENDING',
            note: validated.note,
            changedBy: userId,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        branch: true,
        statusHistory: true,
      },
    });

    // Update product names in order items
    await Promise.all(
      order.items.map(async (item) => {
        if (item.product) {
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { productName: item.product.name },
          });
        }
      })
    );

    return this.transformOrder(order);
  }

  /**
   * Update order
   */
  async update(
    tenantId: string,
    userId: string,
    id: string,
    data: z.infer<typeof orderUpdateSchema>
  ) {
    const validated = orderUpdateSchema.parse(data);

    // Check if order exists
    const existingOrder = await prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!existingOrder) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // If status is being changed, add to status history
    const updateData: any = { ...validated };
    
    if (validated.status && validated.status !== existingOrder.status) {
      // Handle status-specific logic
      if (validated.status === 'READY') {
        updateData.isDeliveryReady = true;
        updateData.readyAt = new Date();
      } else if (validated.status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (validated.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }

      // Create status history entry
      await prisma.orderStatus.create({
        data: {
          orderId: id,
          status: validated.status,
          note: validated.note || validated.cancelReason,
          changedBy: userId,
        },
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        branch: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    return this.transformOrder(order);
  }

  /**
   * Add payment to order
   */
  async addPayment(
    tenantId: string,
    id: string,
    data: z.infer<typeof orderPaymentSchema>
  ) {
    const validated = orderPaymentSchema.parse(data);

    const order = await prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const newPaidAmount = Number(order.paidAmount) + validated.amount;
    const dueAmount = Number(order.total) - newPaidAmount;
    const paymentStatus = 
      dueAmount <= 0 ? 'PAID' : 
      newPaidAmount > 0 ? 'PARTIAL' : 
      'UNPAID';

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: Math.max(0, dueAmount),
        paymentStatus,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        branch: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    return this.transformOrder(updatedOrder);
  }

  /**
   * Delete order (soft delete by cancelling)
   */
  async delete(tenantId: string, userId: string, id: string, reason?: string) {
    const order = await prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status === 'CANCELLED') {
      throw new AppError('Order is already cancelled', 400, 'ORDER_ALREADY_CANCELLED');
    }

    // Cancel the order
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by user',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        branch: true,
        statusHistory: true,
      },
    });

    // Add status history
    await prisma.orderStatus.create({
      data: {
        orderId: id,
        status: 'CANCELLED',
        note: reason || 'Cancelled by user',
        changedBy: userId,
      },
    });

    return this.transformOrder(cancelledOrder);
  }

  /**
   * Get order statistics
   */
  async getStats(tenantId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    branchId?: string;
  }) {
    const where: any = { tenantId };

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      unpaidAmount,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'PENDING' } }),
      prisma.order.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.order.count({ where: { ...where, status: 'READY' } }),
      prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { ...where, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
        _sum: { dueAmount: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      unpaidAmount: Number(unpaidAmount._sum.dueAmount || 0),
    };
  }
}

export default new OmsService();

