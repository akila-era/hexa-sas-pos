import { prisma } from '../database/client';
import { AppError } from '../types';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';

export class ReportService {
  /**
   * Get sales summary report
   */
  async getSalesSummary(
    companyId: string,
    filters: {
      branchId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: any = {
      tenantId: companyId,
      saleStatus: 'COMPLETED',
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.startDate || filters.endDate) {
      where.saleDate = {};
      if (filters.startDate) {
        where.saleDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.saleDate.lte = filters.endDate;
      }
    }

    const [sales, totals] = await Promise.all([
      // @ts-ignore - Prisma client type mismatch
      (prisma as any).sale.findMany({
        where,
        include: {
          items: true,
          customer: true,
        },
        orderBy: { saleDate: 'desc' },
      }),
      // @ts-ignore - Prisma client type mismatch
      (prisma as any).sale.aggregate({
        where,
        _sum: {
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          totalAmount: true,
          paidAmount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const totalDue = Number(totals._sum.totalAmount || 0) - Number(totals._sum.paidAmount || 0);

    return {
      summary: {
        totalSales: totals._count.id,
        totalRevenue: totals._sum.totalAmount || 0,
        totalSubtotal: totals._sum.subtotal || 0,
        totalTax: totals._sum.taxAmount || 0,
        totalDiscount: totals._sum.discountAmount || 0,
        totalPaid: totals._sum.paidAmount || 0,
        totalDue,
      },
      sales,
    };
  }

  /**
   * Get top selling products
   */
  async getTopProducts(
    companyId: string,
    filters: {
      branchId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ) {
    const limit = filters.limit || 10;

    const where: any = {
      tenantId: companyId,
      saleStatus: 'COMPLETED',
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.startDate || filters.endDate) {
      where.saleDate = {};
      if (filters.startDate) {
        where.saleDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.saleDate.lte = filters.endDate;
      }
    }

    // Get all sales in date range
    // @ts-ignore - Prisma client type mismatch
    const sales = await (prisma as any).sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Aggregate by product
    const productMap = new Map();

    sales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const productId = item.productId;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            productName: item.productName,
            sku: item.sku,
            totalQuantity: 0,
            totalRevenue: 0,
          });
        }

        const product = productMap.get(productId);
        product.totalQuantity += item.quantity;
        product.totalRevenue += parseFloat(item.totalAmount.toString());
      });
    });

    // Convert to array and sort by revenue
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return topProducts;
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(companyId: string, branchId?: string) {
    const where: any = {
      tenantId: companyId,
      isActive: true,
      deletedAt: null,
    };

    if (branchId) {
      where.warehouses = {
        some: {
          branchId,
        },
      };
    }

    // @ts-ignore - Prisma client type mismatch
    const products = await (prisma.product.findMany as any)({
      where,
      include: {
        stock: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    let totalStockValue = 0;
    let lowStockCount = 0;

    products.forEach((product: any) => {
      let totalQuantity = 0;
      product.stock?.forEach((s: any) => {
        totalQuantity += s.quantity;
      });

      const stockValue = totalQuantity * parseFloat(product.costPrice?.toString() || '0');
      totalStockValue += stockValue;

      if (totalQuantity <= product.minStockLevel) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      lowStockCount,
      totalStockValue,
    };
  }

  /**
   * Get daily sales report
   */
  async getDailySales(
    companyId: string,
    filters: {
      branchId?: string;
      startDate: Date;
      endDate: Date;
    }
  ) {
    const where: any = {
      tenantId: companyId, // Use tenantId instead of companyId
      saleStatus: 'COMPLETED',
      saleDate: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    // @ts-ignore - Prisma client type mismatch
    const sales = await (prisma as any).sale.findMany({
      where,
      select: {
        saleDate: true,
        totalAmount: true,
        paidAmount: true,
      },
      orderBy: { saleDate: 'asc' },
    });

    // Group by date
    const dailyData = new Map();

    sales.forEach((sale: any) => {
      const dateStr = sale.saleDate.toISOString().split('T')[0];
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, {
          date: dateStr,
          totalSales: 0,
          totalRevenue: 0,
          totalPaid: 0,
        });
      }

      const day = dailyData.get(dateStr);
      day.totalSales += 1;
      day.totalRevenue += parseFloat(sale.totalAmount.toString());
      day.totalPaid += parseFloat(sale.paidAmount.toString());
    });

    return Array.from(dailyData.values());
  }
}

export default new ReportService();

