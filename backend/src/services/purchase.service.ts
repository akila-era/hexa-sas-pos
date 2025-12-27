import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface PurchaseQuery {
  tenantId: string;
  branchId?: string;
  supplierId?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PurchaseItemData {
  productId: string;
  qty: number;
  price: number;
  discount?: number;
  tax?: number;
  expiryDate?: Date;
}

interface CreatePurchaseData {
  tenantId: string;
  branchId: string;
  supplierId: string;
  warehouseId: string;
  referenceNumber?: string;
  items: PurchaseItemData[];
  discount?: number;
  shippingCost?: number;
  note?: string;
  createdBy?: string;
}

interface UpdatePurchaseData {
  status?: string;
  paymentStatus?: string;
  note?: string;
}

class PurchaseService {
  async findAll(query: PurchaseQuery) {
    const {
      tenantId,
      branchId,
      supplierId,
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.PurchaseWhereInput = {
      tenantId,
      ...(branchId && { branchId }),
      ...(supplierId && { supplierId }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(startDate && endDate && {
        createdAt: { gte: startDate, lte: endDate },
      }),
      ...(search && {
        OR: [
          { purchaseNumber: { contains: search, mode: 'insensitive' } },
          { referenceNumber: { contains: search, mode: 'insensitive' } },
          { supplier: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    return { purchases, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const purchase = await prisma.purchase.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        payments: true,
      },
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    return purchase;
  }

  async create(data: CreatePurchaseData) {
    const { items, warehouseId, ...purchaseData } = data;

    // Generate purchase number
    const count = await prisma.purchase.count({
      where: { tenantId: data.tenantId },
    });
    const purchaseNumber = `PUR-${String(count + 1).padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map(item => {
      const itemTotal = item.qty * item.price - (item.discount || 0) + (item.tax || 0);
      subtotal += itemTotal;
      return { ...item, total: itemTotal, receivedQty: item.qty };
    });

    const taxAmount = processedItems.reduce((sum, item) => sum + (item.tax || 0), 0);
    const total = subtotal - (purchaseData.discount || 0) + (purchaseData.shippingCost || 0);

    return prisma.$transaction(async (tx) => {
      // Create purchase
      const purchase = await tx.purchase.create({
        data: {
          ...purchaseData,
          purchaseNumber,
          subtotal,
          taxAmount,
          total,
          dueAmount: total,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      // Update stock for each item
      for (const item of processedItems) {
        // Update or create stock
        await tx.stock.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId,
            },
          },
          create: {
            productId: item.productId,
            warehouseId,
            quantity: item.qty,
          },
          update: {
            quantity: { increment: item.qty },
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId,
            type: 'IN',
            quantity: item.qty,
            refType: 'PURCHASE',
            refId: purchase.id,
          },
        });
      }

      // Update supplier balance
      await tx.supplier.update({
        where: { id: data.supplierId },
        data: { balance: { increment: total } },
      });

      return purchase;
    });
  }

  async addPayment(purchaseId: string, tenantId: string, paymentData: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    note?: string;
  }) {
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, tenantId },
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    const newPaidAmount = Number(purchase.paidAmount) + paymentData.amount;
    const newDueAmount = Number(purchase.total) - newPaidAmount;
    const paymentStatus = newDueAmount <= 0 ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : 'UNPAID';

    return prisma.$transaction(async (tx) => {
      await tx.purchasePayment.create({
        data: {
          purchaseId,
          ...paymentData,
        },
      });

      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: Math.max(0, newDueAmount),
          paymentStatus,
        },
      });

      // Update supplier balance
      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: { balance: { decrement: paymentData.amount } },
      });

      return updatedPurchase;
    });
  }

  async update(id: string, tenantId: string, data: UpdatePurchaseData) {
    const purchase = await prisma.purchase.findFirst({
      where: { id, tenantId },
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    return prisma.purchase.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const purchase = await prisma.purchase.findFirst({
      where: { id, tenantId },
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.status === 'RECEIVED') {
      throw new Error('Cannot delete received purchase');
    }

    return prisma.purchase.delete({ where: { id } });
  }
}

export default new PurchaseService();

