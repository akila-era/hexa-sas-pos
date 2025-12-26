import { prisma } from '../database/client';
import { AppError } from '../types';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { posOrderCreateSchema } from '../utils/validation';
import { z } from 'zod';

/**
 * POS Service
 * 
 * Handles Point of Sale operations with proper transaction management
 * to prevent race conditions and ensure data consistency.
 */
export class PosService {
  /**
   * POS Checkout - Create order, deduct stock, and create sale record
   * 
   * This method uses a single Prisma transaction to ensure atomicity:
   * 1. Validates available stock (with locking to prevent race conditions)
   * 2. Deducts stock via StockMovement
   * 3. Creates POSOrder and POSOrderItems
   * 4. Creates Sale and SaleItems
   * 
   * All operations are atomic - either all succeed or all fail.
   */
  async createOrder(
    companyId: string,
    branchId: string,
    cashierId: string,
    data: z.infer<typeof posOrderCreateSchema>
  ) {
    const validated = posOrderCreateSchema.parse(data);

    // Pre-validate entities outside transaction (for early error detection)
    // Verify warehouse if provided
    let warehouseId: string | undefined = validated.warehouseId ? String(validated.warehouseId) : undefined;
    if (warehouseId) {
      const warehouse = await (prisma as any).warehouse.findFirst({
        where: {
          id: warehouseId,
          tenantId: companyId,
        },
      });
      if (!warehouse) {
        throw new AppErrorClass('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
      }
    } else {
      // Find default warehouse for branch
      const defaultWarehouse = await (prisma as any).warehouse.findFirst({
        where: {
          tenantId: companyId,
          branchId: branchId,
        },
      });
      if (!defaultWarehouse) {
        throw new AppErrorClass('No warehouse available', 404, 'NO_WAREHOUSE');
      }
      warehouseId = defaultWarehouse.id;
    }

    // Verify customer if provided
    if (validated.customerId) {
      const customer = await (prisma as any).customer.findFirst({
        where: {
          id: String(validated.customerId),
          tenantId: companyId,
        },
      });
      if (!customer) {
        throw new AppErrorClass('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }
    }

    // Verify all products exist (but don't check stock yet - do it in transaction)
    const products = await Promise.all(
      validated.items.map(async (item) => {
        const product = await (prisma as any).product.findFirst({
          where: {
            id: String(item.productId),
            tenantId: companyId,
            isActive: true,
          },
        });

        if (!product) {
          throw new AppErrorClass(
            `Product ${item.productId} not found`,
            404,
            'PRODUCT_NOT_FOUND'
          );
        }

        return product;
      })
    );

    // Calculate totals (no tax in new schema, just simple price * quantity)
    let total = 0;
    validated.items.forEach((item) => {
      total += Number(item.unitPrice) * item.quantity;
    });
    total -= validated.discountAmount || 0;

    // Execute all operations in a single transaction to prevent race conditions
    return await prisma.$transaction(
      async (tx) => {
        // Step 1: Validate and lock stock records (prevents race conditions)
        const stockValidations = await Promise.all(
          validated.items.map(async (item) => {
            // Get or create stock record
            let stock = await (tx as any).stock.findUnique({
              where: {
                productId_warehouseId: {
                  productId: String(item.productId),
                  warehouseId: warehouseId!,
                },
              },
            });

            if (!stock) {
              // Create stock record if it doesn't exist
              stock = await (tx as any).stock.create({
                data: {
                  productId: String(item.productId),
                  warehouseId: warehouseId!,
                  quantity: 0,
                },
              });
            }

            // Validate stock availability
            if (stock.quantity < item.quantity) {
              const product = products.find((p) => p.id === item.productId);
              throw new AppErrorClass(
                `Insufficient stock for product ${product?.name || item.productId}. Available: ${stock.quantity}, Requested: ${item.quantity}`,
                400,
                'INSUFFICIENT_STOCK'
              );
            }

            return { stock, item };
          })
        );

        // Step 2: Create POS Order
        const posOrder = await (tx as any).pOSOrder.create({
          data: {
            tenantId: companyId,
            branchId: branchId,
            cashierId: cashierId,
            total: total,
            payment: validated.paymentMethodId ? String(validated.paymentMethodId) : 'CASH',
          },
        });

        // Step 3: Create Sale record
        const sale = await (tx as any).sale.create({
          data: {
            tenantId: companyId,
            branchId: branchId,
            posOrderId: posOrder.id,
            customerId: validated.customerId ? String(validated.customerId) : undefined,
            total: total,
            status: 'PAID',
          },
        });

        // Step 4: Create POS Order Items, Sale Items, Stock Movements, and Update Stock
        await Promise.all(
          validated.items.map(async (item, index) => {
            const product = products[index];
            const { stock } = stockValidations[index];

            // Create POS Order Item
            await (tx as any).pOSOrderItem.create({
              data: {
                posOrderId: posOrder.id,
                productId: String(item.productId),
                qty: item.quantity,
                price: Number(item.unitPrice),
              },
            });

            // Create Sale Item
            await (tx as any).saleItem.create({
              data: {
                saleId: sale.id,
                productId: String(item.productId),
                qty: item.quantity,
                price: Number(item.unitPrice),
              },
            });

            // Create Stock Movement (OUT)
            await (tx as any).stockMovement.create({
              data: {
                productId: String(item.productId),
                warehouseId: warehouseId!,
                type: 'OUT',
                quantity: item.quantity,
                refType: 'POS_ORDER',
                refId: posOrder.id,
              },
            });

            // Update Stock quantity (deduct)
            const newQuantity = stock.quantity - item.quantity;
            await (tx as any).stock.update({
              where: {
                productId_warehouseId: {
                  productId: String(item.productId),
                  warehouseId: warehouseId!,
                },
              },
              data: {
                quantity: newQuantity,
              },
            });
          })
        );

        // Step 5: Fetch complete order with all relations
        const completeOrder = await (tx as any).pOSOrder.findUnique({
          where: { id: posOrder.id },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            cashier: {
              select: {
                id: true,
                email: true,
              },
            },
            sale: {
              include: {
                customer: true,
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        });

        return completeOrder!;
      },
      {
        isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
        timeout: 30000, // 30 second timeout
      }
    );
  }

  async getOrders(
    companyId: string,
    filters: {
      branchId?: string;
      customerId?: string;
      cashierId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.customerId) {
      where.sale = {
        customerId: filters.customerId,
      };
    }

    if (filters.cashierId) {
      where.cashierId = filters.cashierId;
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

    const [orders, total] = await Promise.all([
      (prisma as any).pOSOrder.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          sale: {
            include: {
              customer: true,
            },
          },
          cashier: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).pOSOrder.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(companyId: string, id: string) {
    const order = await (prisma as any).pOSOrder.findFirst({
      where: {
        id,
        tenantId: companyId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        sale: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        cashier: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppErrorClass('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    return order;
  }

  private async generateOrderNumber(companyId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `POS-${dateStr}-`;

    // Get count of orders today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await (prisma as any).pOSOrder.count({
      where: {
        tenantId: companyId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  private async generateSaleNumber(companyId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SALE-${dateStr}-`;

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await (prisma as any).sale.count({
      where: {
        tenantId: companyId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}${sequence}`;
  }
}

export default new PosService();
