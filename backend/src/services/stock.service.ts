import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { z } from 'zod';

// Types
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
export type StockReferenceType = 'SALE' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'TRANSFER';

// Validation schemas
export const stockCreateSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().min(0),
  personId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const stockAdjustmentCreateSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  type: z.enum(['ADD', 'SUBTRACT']),
  quantity: z.number().int().min(1),
  referenceNumber: z.string().optional(),
  personId: z.string().uuid().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const stockTransferCreateSchema = z.object({
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class StockService {
  // Helper to format date for frontend
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // =====================
  // MANAGE STOCK FUNCTIONS
  // =====================

  /**
   * Get all stock items (for Manage Stock page)
   */
  async getAllStock(tenantId: string, filters: z.infer<typeof paginationSchema> & {
    search?: string;
    warehouseId?: string;
    productId?: string;
  }) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      warehouse: {
        tenantId,
      },
    };

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.search) {
      where.OR = [
        { product: { name: { contains: filters.search, mode: 'insensitive' } } },
        { warehouse: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    const [stocks, total] = await Promise.all([
      (prisma as any).stock.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              image: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).stock.count({ where }),
    ]);

    // Format for frontend
    const formattedData = stocks.map((stock: any) => ({
      id: stock.id,
      warehouse: stock.warehouse?.name || 'Unknown',
      store: stock.warehouse?.branch?.name || 'Main Store',
      product: {
        name: stock.product?.name || 'Unknown',
        image: stock.product?.image || null,
      },
      date: this.formatDate(stock.updatedAt),
      person: {
        name: 'System', // TODO: Track user who last modified
        image: null,
      },
      qty: stock.quantity,
    }));

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add stock to a product in a warehouse
   */
  async addStock(tenantId: string, data: z.infer<typeof stockCreateSchema>, userId?: string) {
    const validated = stockCreateSchema.parse(data);

    // Verify product and warehouse belong to tenant
    const [product, warehouse] = await Promise.all([
      (prisma as any).product.findFirst({
        where: { id: validated.productId, tenantId },
      }),
      (prisma as any).warehouse.findFirst({
        where: { id: validated.warehouseId, tenantId },
      }),
    ]);

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    if (!warehouse) {
      throw new AppErrorClass('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
    }

    // Use transaction
    return await prisma.$transaction(async (tx) => {
      // Get or create stock record
      let stock = await (tx as any).stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: validated.productId,
            warehouseId: validated.warehouseId,
          },
        },
      });

      if (!stock) {
        stock = await (tx as any).stock.create({
          data: {
            productId: validated.productId,
            warehouseId: validated.warehouseId,
            quantity: validated.quantity,
          },
        });
      } else {
        stock = await (tx as any).stock.update({
          where: {
            productId_warehouseId: {
              productId: validated.productId,
              warehouseId: validated.warehouseId,
            },
          },
          data: {
            quantity: stock.quantity + validated.quantity,
          },
        });
      }

      // Create stock movement
      await (tx as any).stockMovement.create({
        data: {
          productId: validated.productId,
          warehouseId: validated.warehouseId,
          type: 'IN',
          quantity: validated.quantity,
          refType: 'ADJUSTMENT',
          note: validated.notes || 'Manual stock addition',
          createdBy: userId,
        },
      });

      return stock;
    });
  }

  /**
   * Update stock quantity
   */
  async updateStock(tenantId: string, stockId: string, quantity: number, userId?: string) {
    const stock = await (prisma as any).stock.findFirst({
      where: {
        id: stockId,
        warehouse: { tenantId },
      },
    });

    if (!stock) {
      throw new AppErrorClass('Stock record not found', 404, 'STOCK_NOT_FOUND');
    }

    const difference = quantity - stock.quantity;

    return await prisma.$transaction(async (tx) => {
      // Update stock
      const updatedStock = await (tx as any).stock.update({
        where: { id: stockId },
        data: { quantity },
      });

      // Create adjustment movement
      if (difference !== 0) {
        await (tx as any).stockMovement.create({
          data: {
            productId: stock.productId,
            warehouseId: stock.warehouseId,
            type: 'ADJUSTMENT',
            quantity: difference,
            refType: 'ADJUSTMENT',
            note: 'Manual stock update',
            createdBy: userId,
          },
        });
      }

      return updatedStock;
    });
  }

  // ===========================
  // STOCK ADJUSTMENT FUNCTIONS
  // ===========================

  /**
   * Create stock adjustment
   */
  async createAdjustment(tenantId: string, data: z.infer<typeof stockAdjustmentCreateSchema>, userId?: string) {
    const validated = stockAdjustmentCreateSchema.parse(data);

    // Verify product and warehouse belong to tenant
    const [product, warehouse] = await Promise.all([
      (prisma as any).product.findFirst({
        where: { id: validated.productId, tenantId },
      }),
      (prisma as any).warehouse.findFirst({
        where: { id: validated.warehouseId, tenantId },
      }),
    ]);

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    if (!warehouse) {
      throw new AppErrorClass('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
    }

    return await prisma.$transaction(async (tx) => {
      // Create stock adjustment record
      const adjustment = await (tx as any).stockAdjustment.create({
        data: {
          warehouseId: validated.warehouseId,
          type: validated.type,
          reason: validated.reason || null,
          note: validated.notes || null,
          createdBy: userId,
          items: {
            create: {
              productId: validated.productId,
              quantity: validated.quantity,
            },
          },
        },
        include: {
          items: true,
        },
      });

      // Update stock
      const quantityChange = validated.type === 'ADD' ? validated.quantity : -validated.quantity;

      let stock = await (tx as any).stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: validated.productId,
            warehouseId: validated.warehouseId,
          },
        },
      });

      if (!stock) {
        if (validated.type === 'SUBTRACT') {
          throw new AppErrorClass('Cannot subtract from zero stock', 400, 'INSUFFICIENT_STOCK');
        }
        stock = await (tx as any).stock.create({
          data: {
            productId: validated.productId,
            warehouseId: validated.warehouseId,
            quantity: validated.quantity,
          },
        });
      } else {
        const newQuantity = stock.quantity + quantityChange;
        if (newQuantity < 0) {
          throw new AppErrorClass('Insufficient stock for subtraction', 400, 'INSUFFICIENT_STOCK');
        }
        stock = await (tx as any).stock.update({
          where: {
            productId_warehouseId: {
              productId: validated.productId,
              warehouseId: validated.warehouseId,
            },
          },
          data: { quantity: newQuantity },
        });
      }

      // Create movement record
      await (tx as any).stockMovement.create({
        data: {
          productId: validated.productId,
          warehouseId: validated.warehouseId,
          type: 'ADJUSTMENT',
          quantity: quantityChange,
          refType: 'ADJUSTMENT',
          refId: adjustment.id,
          note: validated.notes,
          createdBy: userId,
        },
      });

      return adjustment;
    });
  }

  /**
   * Get all stock adjustments
   */
  async getAllAdjustments(tenantId: string, filters: z.infer<typeof paginationSchema> & {
    warehouseId?: string;
    type?: 'ADD' | 'SUBTRACT';
  }) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      warehouse: { tenantId },
    };

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const [adjustments, total] = await Promise.all([
      (prisma as any).stockAdjustment.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).stockAdjustment.count({ where }),
    ]);

    return {
      data: adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===========================
  // STOCK TRANSFER FUNCTIONS  
  // ===========================

  /**
   * Create stock transfer between warehouses
   */
  async createTransfer(tenantId: string, data: z.infer<typeof stockTransferCreateSchema>, userId?: string) {
    const validated = stockTransferCreateSchema.parse(data);

    // Verify warehouses belong to tenant
    const [fromWarehouse, toWarehouse] = await Promise.all([
      (prisma as any).warehouse.findFirst({
        where: { id: validated.fromWarehouseId, tenantId },
      }),
      (prisma as any).warehouse.findFirst({
        where: { id: validated.toWarehouseId, tenantId },
      }),
    ]);

    if (!fromWarehouse) {
      throw new AppErrorClass('Source warehouse not found', 404, 'FROM_WAREHOUSE_NOT_FOUND');
    }
    if (!toWarehouse) {
      throw new AppErrorClass('Destination warehouse not found', 404, 'TO_WAREHOUSE_NOT_FOUND');
    }

    if (validated.fromWarehouseId === validated.toWarehouseId) {
      throw new AppErrorClass('Cannot transfer to the same warehouse', 400, 'SAME_WAREHOUSE');
    }

    return await prisma.$transaction(async (tx) => {
      // Verify stock availability for all items
      for (const item of validated.items) {
        const stock = await (tx as any).stock.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: validated.fromWarehouseId,
            },
          },
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new AppErrorClass(
            `Insufficient stock for product ${item.productId}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // Create transfer record
      const transfer = await (tx as any).stockTransfer.create({
        data: {
          fromWarehouseId: validated.fromWarehouseId,
          toWarehouseId: validated.toWarehouseId,
          status: 'COMPLETED',
          note: validated.notes,
          createdBy: userId,
          completedAt: new Date(),
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: true,
          fromWarehouse: true,
          toWarehouse: true,
        },
      });

      // Update stock for each item
      for (const item of validated.items) {
        // Decrease from source warehouse
        await (tx as any).stock.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: validated.fromWarehouseId,
            },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        // Increase in destination warehouse (create if not exists)
        await (tx as any).stock.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: validated.toWarehouseId,
            },
          },
          create: {
            productId: item.productId,
            warehouseId: validated.toWarehouseId,
            quantity: item.quantity,
          },
          update: {
            quantity: { increment: item.quantity },
          },
        });

        // Create movement records
        await (tx as any).stockMovement.createMany({
          data: [
            {
              productId: item.productId,
              warehouseId: validated.fromWarehouseId,
              type: 'OUT',
              quantity: item.quantity,
              refType: 'TRANSFER',
              refId: transfer.id,
              createdBy: userId,
            },
            {
              productId: item.productId,
              warehouseId: validated.toWarehouseId,
              type: 'IN',
              quantity: item.quantity,
              refType: 'TRANSFER',
              refId: transfer.id,
              createdBy: userId,
            },
          ],
        });
      }

      return transfer;
    });
  }

  /**
   * Get all stock transfers
   */
  async getAllTransfers(tenantId: string, filters: z.infer<typeof paginationSchema> & {
    fromWarehouseId?: string;
    toWarehouseId?: string;
    status?: string;
  }) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      fromWarehouse: { tenantId },
    };

    if (filters.fromWarehouseId) {
      where.fromWarehouseId = filters.fromWarehouseId;
    }

    if (filters.toWarehouseId) {
      where.toWarehouseId = filters.toWarehouseId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [transfers, total] = await Promise.all([
      (prisma as any).stockTransfer.findMany({
        where,
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).stockTransfer.count({ where }),
    ]);

    // Format for frontend
    const formattedData = transfers.map((t: any) => ({
      id: t.id,
      fromWarehouse: t.fromWarehouse?.name || 'Unknown',
      toWarehouse: t.toWarehouse?.name || 'Unknown',
      noOfProducts: t.items?.length || 0,
      quantityTransferred: t.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      refNumber: `#${t.id.slice(0, 6).toUpperCase()}`,
      date: this.formatDate(t.createdAt),
      status: t.status,
    }));

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single transfer by ID
   */
  async getTransferById(tenantId: string, id: string) {
    const transfer = await (prisma as any).stockTransfer.findFirst({
      where: {
        id,
        fromWarehouse: { tenantId },
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new AppErrorClass('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
    }

    return transfer;
  }

  /**
   * Delete transfer (only if pending)
   */
  async deleteTransfer(tenantId: string, id: string) {
    const transfer = await (prisma as any).stockTransfer.findFirst({
      where: {
        id,
        fromWarehouse: { tenantId },
      },
    });

    if (!transfer) {
      throw new AppErrorClass('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
    }

    if (transfer.status === 'COMPLETED') {
      throw new AppErrorClass('Cannot delete completed transfer', 400, 'TRANSFER_COMPLETED');
    }

    await (prisma as any).stockTransfer.delete({
      where: { id },
    });

    return { message: 'Transfer deleted successfully' };
  }

  // ===========================
  // EXISTING FUNCTIONS (Updated)
  // ===========================

  /**
   * Create a stock movement and update stock quantity
   */
  async createStockMovement(
    companyId: string,
    data: {
      productId: string;
      warehouseId: string;
      movementType: StockMovementType;
      quantity: number;
      referenceType?: StockReferenceType;
      referenceId?: string;
      notes?: string;
      createdBy?: string;
    }
  ) {
    // Verify product belongs to company
    const product = await (prisma as any).product.findFirst({
      where: { id: data.productId, tenantId: companyId },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Verify warehouse belongs to company
    const warehouse = await (prisma as any).warehouse.findFirst({
      where: { id: data.warehouseId, tenantId: companyId },
    });

    if (!warehouse) {
      throw new AppErrorClass('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
    }

    // Map movement type
    let movementType = data.movementType;
    if (data.movementType === 'RETURN') movementType = 'IN' as any;
    else if (data.movementType === 'TRANSFER') movementType = 'OUT' as any;

    return await prisma.$transaction(async (tx) => {
      const movement = await (tx as any).stockMovement.create({
        data: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          type: movementType,
          quantity: data.quantity,
          refType: data.referenceType,
          refId: data.referenceId,
          note: data.notes,
          createdBy: data.createdBy,
        },
      });

      // Get or create stock
      let stock = await (tx as any).stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
      });

      if (!stock) {
        stock = await (tx as any).stock.create({
          data: {
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: 0,
          },
        });
      }

      // Update quantity
      let newQuantity = stock.quantity;
      if (movementType === 'IN') {
        newQuantity += data.quantity;
      } else if (movementType === 'OUT') {
        newQuantity -= data.quantity;
        if (newQuantity < 0) {
          throw new AppErrorClass('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
        }
      } else if (movementType === 'ADJUSTMENT') {
        newQuantity += data.quantity;
        if (newQuantity < 0) {
          throw new AppErrorClass('Adjustment would result in negative stock', 400, 'INVALID_ADJUSTMENT');
        }
      }

      await (tx as any).stock.update({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        data: { quantity: newQuantity },
      });

      return movement;
    });
  }

  /**
   * Get current stock for a product in a warehouse
   */
  async getStock(companyId: string, productId: string, warehouseId: string) {
    const product = await (prisma as any).product.findFirst({
      where: { id: productId, tenantId: companyId },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const stock = await (prisma as any).stock.findUnique({
      where: {
        productId_warehouseId: { productId, warehouseId },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return stock || { productId, warehouseId, quantity: 0 };
  }

  /**
   * Get stock movements
   */
  async getStockMovements(
    companyId: string,
    filters: {
      productId?: string;
      warehouseId?: string;
      movementType?: StockMovementType;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      warehouse: { tenantId: companyId },
    };

    if (filters.productId) where.productId = filters.productId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.movementType) where.type = filters.movementType;

    const [movements, total] = await Promise.all([
      (prisma as any).stockMovement.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).stockMovement.count({ where }),
    ]);

    return {
      data: movements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Check stock availability
   */
  async checkStockAvailability(
    companyId: string,
    items: Array<{ productId: string; quantity: number; warehouseId: string }>
  ) {
    const availability = await Promise.all(
      items.map(async (item) => {
        const stock = await (prisma as any).stock.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: item.warehouseId,
            },
          },
        });

        const availableQuantity = stock ? stock.quantity : 0;

        return {
          productId: item.productId,
          warehouseId: item.warehouseId,
          requestedQuantity: item.quantity,
          availableQuantity,
          isAvailable: availableQuantity >= item.quantity,
        };
      })
    );

    return {
      items: availability,
      allAvailable: availability.every((item) => item.isAvailable),
    };
  }
}

export default new StockService();
