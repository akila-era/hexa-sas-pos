import { prisma } from '../database/client';
import { AppError } from '../types';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { StockMovementType, StockReferenceType } from '../types';

export class StockService {
  /**
   * Create a stock movement and update stock quantity
   * This is the ONLY way to update stock - no direct stock updates allowed
   */
  async createStockMovement(
    companyId: string,
    data: {
      productId: string | number;
      warehouseId: string | number;
      movementType: StockMovementType;
      quantity: number;
      referenceType?: StockReferenceType;
      referenceId?: string | number;
      notes?: string;
      createdBy?: string | number;
    }
  ) {
    const productId = String(data.productId);
    const warehouseId = String(data.warehouseId);

    // Verify product belongs to company
    const product = await (prisma as any).product.findFirst({
      where: {
        id: productId,
        tenantId: companyId,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Verify warehouse belongs to company
    const warehouse = await (prisma as any).warehouse.findFirst({
      where: {
        id: warehouseId,
        tenantId: companyId,
      },
    });

    if (!warehouse) {
      throw new AppErrorClass('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
    }

    // Map movementType to new schema type field
    // New schema only supports: IN, OUT, ADJUST
    let movementType: string = data.movementType;
    if (data.movementType === 'RETURN') {
      movementType = 'IN'; // Returns are treated as IN
    } else if (data.movementType === 'TRANSFER') {
      movementType = 'OUT'; // Transfers are treated as OUT (source warehouse)
    } else if (data.movementType === 'ADJUSTMENT') {
      movementType = 'ADJUST';
    }

    // Use transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
      // Create stock movement
      const movement = await (tx as any).stockMovement.create({
        data: {
          productId: productId,
          warehouseId: warehouseId,
          type: movementType,
          quantity: data.quantity,
          refType: data.referenceType,
          refId: data.referenceId ? String(data.referenceId) : null,
        },
      });

      // Get or create stock record
      let stock = await (tx as any).stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: productId,
            warehouseId: warehouseId,
          },
        },
      });

      if (!stock) {
        stock = await (tx as any).stock.create({
          data: {
            productId: productId,
            warehouseId: warehouseId,
            quantity: 0,
          },
        });
      }

      // Update stock quantity based on movement type
      let newQuantity = stock.quantity;
      if (movementType === 'IN') {
        newQuantity += data.quantity;
      } else if (movementType === 'OUT') {
        newQuantity -= data.quantity;
        if (newQuantity < 0) {
          throw new AppErrorClass(
            'Insufficient stock',
            400,
            'INSUFFICIENT_STOCK'
          );
        }
      } else if (movementType === 'ADJUST') {
        // For adjustments, quantity can be positive or negative
        newQuantity += data.quantity;
        if (newQuantity < 0) {
          throw new AppErrorClass(
            'Adjustment would result in negative stock',
            400,
            'INVALID_ADJUSTMENT'
          );
        }
      }

      // Update stock
      await (tx as any).stock.update({
        where: {
          productId_warehouseId: {
            productId: productId,
            warehouseId: warehouseId,
          },
        },
        data: {
          quantity: newQuantity,
        },
      });

      return movement;
    });
  }

  /**
   * Get current stock for a product in a warehouse
   */
  async getStock(companyId: string, productId: string | number, warehouseId: string | number) {
    const productIdStr = String(productId);
    const warehouseIdStr = String(warehouseId);

    // Verify product belongs to company
    const product = await (prisma as any).product.findFirst({
      where: {
        id: productIdStr,
        tenantId: companyId,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const stock = await (prisma as any).stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: productIdStr,
          warehouseId: warehouseIdStr,
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return stock || {
      productId: productIdStr,
      warehouseId: warehouseIdStr,
      quantity: 0,
      product: await (prisma as any).product.findUnique({ where: { id: productIdStr } }),
      warehouse: await (prisma as any).warehouse.findUnique({ where: { id: warehouseIdStr } }),
    };
  }

  /**
   * Get stock movements for a product
   */
  async getStockMovements(
    companyId: string,
    filters: {
      productId?: string | number;
      warehouseId?: string | number;
      movementType?: StockMovementType;
      referenceType?: StockReferenceType;
      referenceId?: string | number;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.productId) {
      const productIdStr = String(filters.productId);
      // Verify product belongs to company
      const product = await (prisma as any).product.findFirst({
        where: { 
          id: productIdStr, 
          tenantId: companyId 
        },
      });
      if (!product) {
        throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }
      where.productId = productIdStr;
    }

    if (filters.warehouseId) {
      const warehouseIdStr = String(filters.warehouseId);
      // Verify warehouse belongs to company
      const warehouse = await (prisma as any).warehouse.findFirst({
        where: { 
          id: warehouseIdStr, 
          tenantId: companyId 
        },
      });
      if (!warehouse) {
        throw new AppErrorClass('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
      }
      where.warehouseId = warehouseIdStr;
    }

    if (filters.movementType) {
      // Map to new schema type field
      let type: string = filters.movementType;
      if (filters.movementType === 'RETURN') {
        type = 'IN';
      } else if (filters.movementType === 'TRANSFER') {
        type = 'OUT';
      } else if (filters.movementType === 'ADJUSTMENT') {
        type = 'ADJUST';
      }
      where.type = type;
    }

    if (filters.referenceType) {
      where.refType = filters.referenceType;
    }

    if (filters.referenceId) {
      where.refId = String(filters.referenceId);
    }

    const [movements, total] = await Promise.all([
      (prisma as any).stockMovement.findMany({
        where,
        include: {
          product: true,
          warehouse: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).stockMovement.count({ where }),
    ]);

    return {
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check stock availability
   */
  async checkStockAvailability(
    companyId: string,
    items: Array<{ productId: string | number; quantity: number; warehouseId: string | number }>
  ) {
    const availability = await Promise.all(
      items.map(async (item) => {
        const productIdStr = String(item.productId);
        const warehouseIdStr = String(item.warehouseId);

        const stock = await (prisma as any).stock.findUnique({
          where: {
            productId_warehouseId: {
              productId: productIdStr,
              warehouseId: warehouseIdStr,
            },
          },
        });

        // New schema doesn't have reservedQuantity, so available = quantity
        const availableQuantity = stock ? stock.quantity : 0;

        return {
          productId: productIdStr,
          warehouseId: warehouseIdStr,
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

