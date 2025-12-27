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

  /**
   * Get purchase report
   * Returns purchase data grouped by product with filters
   */
  async getPurchaseReport(
    companyId: string,
    filters: {
      branchId?: string;
      warehouseId?: string;
      productId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: any = {
      tenantId: companyId,
      status: 'RECEIVED',
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
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

    // @ts-ignore - Prisma client type mismatch
    const purchases = await (prisma as any).purchase.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by product
    const productMap = new Map();

    purchases.forEach((purchase: any) => {
      purchase.items.forEach((item: any) => {
        const productId = item.productId;
        
        if (filters.productId && productId !== filters.productId) {
          return; // Skip if product filter doesn't match
        }

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            productName: item.product?.name || 'Unknown Product',
            img: item.product?.image || item.product?.images?.[0]?.url || '',
            productAmount: 0,
            productQty: 0,
            instockQty: 0,
          });
        }

        const product = productMap.get(productId);
        product.productAmount += parseFloat(item.total?.toString() || '0');
        product.productQty += item.qty || 0;
      });
    });

    // Get stock quantities for each product
    for (const [productId, productData] of productMap.entries()) {
      const stock = await (prisma as any).stock.findMany({
        where: {
          productId,
          ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
        },
      });

      const totalStock = stock.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
      productData.instockQty = totalStock;
    }

    return Array.from(productMap.values());
  }

  /**
   * Get purchase order report
   * Returns purchase order data with product details
   */
  async getPurchaseOrderReport(
    companyId: string,
    filters: {
      branchId?: string;
      supplierId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
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

    // @ts-ignore - Prisma client type mismatch
    const purchases = await (prisma as any).purchase.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by product
    const productMap = new Map();

    purchases.forEach((purchase: any) => {
      purchase.items.forEach((item: any) => {
        const productId = item.productId;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product: {
              id: productId,
              name: item.product?.name || 'Unknown Product',
              image: item.product?.image || item.product?.images?.[0]?.url || '',
            },
            purchasedAmount: 0,
            purchasedQty: 0,
            instockQty: 0,
          });
        }

        const product = productMap.get(productId);
        product.purchasedAmount += parseFloat(item.total?.toString() || '0');
        product.purchasedQty += item.qty || 0;
      });
    });

    // Get stock quantities for each product
    for (const [productId, productData] of productMap.entries()) {
      const stock = await (prisma as any).stock.findMany({
        where: {
          productId,
        },
      });

      const totalStock = stock.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
      productData.instockQty = totalStock;
    }

    return Array.from(productMap.values());
  }

  /**
   * Get balance sheet
   * Returns financial position with assets, liabilities, and equity
   */
  async getBalanceSheet(
    companyId: string,
    filters: {
      branchId?: string;
      asOfDate?: Date;
    }
  ) {
    const asOfDate = filters.asOfDate || new Date();

    // Get all accounts
    const accounts = await (prisma as any).account.findMany({
      where: {
        tenantId: companyId,
        isActive: true,
      },
      include: {
        transactions: {
          where: {
            date: { lte: asOfDate },
          },
        },
      },
    });

    // Calculate balances for each account
    const accountBalances = accounts.map((account: any) => {
      const balance = account.transactions.reduce((sum: number, t: any) => {
        if (t.type === 'DEBIT') {
          return sum + parseFloat(t.amount.toString());
        } else {
          return sum - parseFloat(t.amount.toString());
        }
      }, parseFloat(account.balance?.toString() || '0'));

      return {
        id: account.id,
        name: account.name,
        code: account.code,
        type: account.type,
        subType: account.subType,
        balance,
        bankAccount: account.bankAccount || '',
      };
    });

    // Group by account type
    const assets = accountBalances.filter((a: any) => 
      a.type === 'ASSET' || a.type === 'CURRENT_ASSET' || a.type === 'FIXED_ASSET'
    );
    const liabilities = accountBalances.filter((a: any) => 
      a.type === 'LIABILITY' || a.type === 'CURRENT_LIABILITY' || a.type === 'LONG_TERM_LIABILITY'
    );
    const equity = accountBalances.filter((a: any) => a.type === 'EQUITY');

    const totalAssets = assets.reduce((sum: number, a: any) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum: number, a: any) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum: number, a: any) => sum + a.balance, 0);

    return {
      asOfDate,
      assets: assets.map((a: any) => ({
        Name: a.name,
        Bank_Account: a.bankAccount || `${a.code} - ${a.name}`,
        Credit: a.balance < 0 ? Math.abs(a.balance).toFixed(2) : '0.00',
        Debit: a.balance >= 0 ? a.balance.toFixed(2) : '0.00',
        Balance: a.balance.toFixed(2),
      })),
      liabilities: liabilities.map((a: any) => ({
        Name: a.name,
        Bank_Account: a.bankAccount || `${a.code} - ${a.name}`,
        Credit: a.balance >= 0 ? a.balance.toFixed(2) : '0.00',
        Debit: a.balance < 0 ? Math.abs(a.balance).toFixed(2) : '0.00',
        Balance: a.balance.toFixed(2),
      })),
      equity: equity.map((a: any) => ({
        Name: a.name,
        Bank_Account: a.bankAccount || `${a.code} - ${a.name}`,
        Credit: a.balance >= 0 ? a.balance.toFixed(2) : '0.00',
        Debit: a.balance < 0 ? Math.abs(a.balance).toFixed(2) : '0.00',
        Balance: a.balance.toFixed(2),
      })),
      totals: {
        totalAssets: totalAssets.toFixed(2),
        totalLiabilities: totalLiabilities.toFixed(2),
        totalEquity: totalEquity.toFixed(2),
        totalLiabilitiesAndEquity: (totalLiabilities + totalEquity).toFixed(2),
      },
    };
  }

  /**
   * Get trial balance
   * Returns all accounts with their debit and credit balances
   */
  async getTrialBalance(
    companyId: string,
    filters: {
      branchId?: string;
      asOfDate?: Date;
    }
  ) {
    const asOfDate = filters.asOfDate || new Date();

    // Get all accounts
    const accounts = await (prisma as any).account.findMany({
      where: {
        tenantId: companyId,
        isActive: true,
      },
      include: {
        transactions: {
          where: {
            date: { lte: asOfDate },
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    // Group accounts by type
    const accountsByType: any = {};
    let totalDebit = 0;
    let totalCredit = 0;

    accounts.forEach((account: any) => {
      // Calculate balance from transactions
      const balance = account.transactions.reduce((sum: number, t: any) => {
        if (t.type === 'DEBIT') {
          return sum + parseFloat(t.amount.toString());
        } else {
          return sum - parseFloat(t.amount.toString());
        }
      }, parseFloat(account.balance?.toString() || '0'));

      const debit = balance >= 0 ? balance : 0;
      const credit = balance < 0 ? Math.abs(balance) : 0;

      totalDebit += debit;
      totalCredit += credit;

      const type = account.type || 'OTHER';
      if (!accountsByType[type]) {
        accountsByType[type] = {
          typeName: this.getAccountTypeName(type),
          accounts: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      }

      accountsByType[type].accounts.push({
        Account_Name: account.name,
        Debit: debit.toFixed(2),
        Credit: credit.toFixed(2),
      });

      accountsByType[type].totalDebit += debit;
      accountsByType[type].totalCredit += credit;
    });

    // Format for frontend
    const formattedData: any[] = [];
    Object.values(accountsByType).forEach((group: any) => {
      formattedData.push({
        Account_Name: group.typeName,
        Debit: '',
        Credit: '',
        isHeader: true,
      });
      
      group.accounts.forEach((acc: any) => {
        formattedData.push(acc);
      });

      formattedData.push({
        Account_Name: `Total ${group.typeName}`,
        Debit: group.totalDebit.toFixed(2),
        Credit: group.totalCredit.toFixed(2),
        isTotal: true,
      });
    });

    return {
      asOfDate,
      accounts: formattedData,
      totals: {
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
      },
    };
  }

  /**
   * Get account type display name
   */
  private getAccountTypeName(type: string): string {
    const typeMap: { [key: string]: string } = {
      'ASSET': 'Assets',
      'CURRENT_ASSET': 'Assets',
      'FIXED_ASSET': 'Assets',
      'LIABILITY': 'Liabilities',
      'CURRENT_LIABILITY': 'Liabilities',
      'LONG_TERM_LIABILITY': 'Liabilities',
      'EQUITY': 'Equity',
      'REVENUE': 'Revenue',
      'EXPENSE': 'Expenses',
      'OTHER': 'Other',
    };
    return typeMap[type] || 'Other';
  }

  /**
   * Get cash flow statement
   * Returns cash flow transactions grouped by activity
   */
  async getCashFlow(
    companyId: string,
    filters: {
      branchId?: string;
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    // Get all account transactions
    const transactions = await (prisma as any).accountTransaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            code: true,
            bankAccount: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Get payments for payment method filter
    let payments: any[] = [];
    if (filters.paymentMethod) {
      payments = await (prisma as any).payment.findMany({
        where: {
          tenantId: companyId,
          paymentMethod: filters.paymentMethod,
          ...(filters.startDate || filters.endDate ? {
            paymentDate: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          } : {}),
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              code: true,
              bankAccount: true,
            },
          },
        },
      });
    }

    // Combine and format transactions
    const cashFlowData: any[] = [];
    let runningBalance = 0;

    // Process account transactions
    transactions.forEach((t: any) => {
      const credit = t.type === 'CREDIT' ? parseFloat(t.amount.toString()) : 0;
      const debit = t.type === 'DEBIT' ? parseFloat(t.amount.toString()) : 0;
      runningBalance += credit - debit;

      cashFlowData.push({
        Date: new Date(t.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        Bank_Account: t.account?.bankAccount || `${t.account?.code} - ${t.account?.name}`,
        Description: t.description || t.reference || 'Transaction',
        Credit: `$${credit.toFixed(2)}`,
        Debit: `$${debit.toFixed(2)}`,
        Account_balance: `$${Math.abs(credit - debit).toFixed(2)}`,
        Total_Balance: `$${runningBalance.toFixed(2)}`,
        Payment_Method: t.paymentMethod || 'N/A',
      });
    });

    // Process payments if filtered
    if (filters.paymentMethod && payments.length > 0) {
      payments.forEach((p: any) => {
        const amount = parseFloat(p.amount.toString());
        runningBalance += amount;

        cashFlowData.push({
          Date: new Date(p.paymentDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          Bank_Account: p.account?.bankAccount || `${p.account?.code} - ${p.account?.name}`,
          Description: p.notes || 'Payment',
          Credit: `$${amount.toFixed(2)}`,
          Debit: '$0.00',
          Account_balance: `$${amount.toFixed(2)}`,
          Total_Balance: `$${runningBalance.toFixed(2)}`,
          Payment_Method: p.paymentMethod || 'N/A',
        });
      });
    }

    // Sort by date descending
    cashFlowData.sort((a, b) => {
      const dateA = new Date(a.Date.split(' ').reverse().join(' '));
      const dateB = new Date(b.Date.split(' ').reverse().join(' '));
      return dateB.getTime() - dateA.getTime();
    });

    return cashFlowData;
  }

  /**
   * Get invoice report
   * Returns invoices with customer details and payment status
   */
  async getInvoiceReport(
    companyId: string,
    filters: {
      branchId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.status) {
      where.invoiceStatus = filters.status.toUpperCase();
    }

    if (filters.startDate || filters.endDate) {
      where.invoiceDate = {};
      if (filters.startDate) {
        where.invoiceDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.invoiceDate.lte = filters.endDate;
      }
    }

    const invoices = await (prisma as any).invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sale: {
          select: {
            id: true,
            saleNumber: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    // Calculate summary
    const totalAmount = invoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.totalAmount?.toString() || '0'), 0
    );
    const totalPaid = invoices.reduce((sum: number, inv: any) => 
      sum + parseFloat(inv.paidAmount?.toString() || '0'), 0
    );
    const totalUnpaid = totalAmount - totalPaid;
    const overdue = invoices
      .filter((inv: any) => {
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
        return dueDate && dueDate < new Date() && inv.paymentStatus !== 'PAID';
      })
      .reduce((sum: number, inv: any) => 
        sum + (parseFloat(inv.totalAmount?.toString() || '0') - parseFloat(inv.paidAmount?.toString() || '0')), 0
      );

    return {
      summary: {
        totalAmount: totalAmount.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalUnpaid: totalUnpaid.toFixed(2),
        overdue: overdue.toFixed(2),
      },
      invoices: invoices.map((inv: any) => ({
        invoiceNo: inv.invoiceNumber,
        customer: inv.customer?.name || 'N/A',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : 'N/A',
        amount: `$${parseFloat(inv.totalAmount?.toString() || '0').toFixed(2)}`,
        paid: `$${parseFloat(inv.paidAmount?.toString() || '0').toFixed(2)}`,
        amountDue: `$${(parseFloat(inv.totalAmount?.toString() || '0') - parseFloat(inv.paidAmount?.toString() || '0')).toFixed(2)}`,
        status: inv.paymentStatus || 'UNPAID',
      })),
    };
  }

  /**
   * Get stock history report
   * Returns stock movements with initial, added, sold, defective, and final quantities
   */
  async getStockHistory(
    companyId: string,
    filters: {
      branchId?: string;
      productId?: string;
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.productId) {
      where.productId = filters.productId;
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

    // Get products with filters
    const productWhere: any = { tenantId: companyId };
    if (filters.categoryId) {
      productWhere.categoryId = filters.categoryId;
    }
    if (filters.productId) {
      productWhere.id = filters.productId;
    }

    const products = await (prisma as any).product.findMany({
      where: productWhere,
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    const stockHistory: any[] = [];

    for (const product of products) {
      // Get initial stock (before date range)
      const initialStock = await (prisma as any).stock.findMany({
        where: {
          productId: product.id,
          ...(filters.branchId && { branchId: filters.branchId }),
        },
      });

      const initialQty = initialStock.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

      // Get stock movements
      const movements = await (prisma as any).stockMovement.findMany({
        where: {
          productId: product.id,
          ...(filters.branchId && { branchId: filters.branchId }),
          ...(filters.startDate || filters.endDate ? {
            createdAt: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          } : {}),
        },
      });

      // Calculate quantities by type
      let addedQty = 0;
      let soldQty = 0;
      let defectiveQty = 0;

      movements.forEach((mov: any) => {
        if (mov.type === 'IN' || mov.type === 'PURCHASE' || mov.type === 'ADJUSTMENT_IN') {
          addedQty += mov.quantity || 0;
        } else if (mov.type === 'OUT' || mov.type === 'SALE' || mov.type === 'ADJUSTMENT_OUT') {
          soldQty += mov.quantity || 0;
        } else if (mov.type === 'DEFECTIVE' || mov.type === 'DAMAGED') {
          defectiveQty += mov.quantity || 0;
        }
      });

      const finalQty = initialQty + addedQty - soldQty - defectiveQty;

      stockHistory.push({
        SKU: product.sku,
        Product_Name: product.name,
        img: product.image || product.images?.[0]?.url || '',
        Initial_Quantity: initialQty.toString(),
        Added_Quantity: addedQty.toString(),
        Sold_Quantity: soldQty.toString(),
        Defective_Quantity: defectiveQty.toString(),
        Final_Quantity: finalQty.toString(),
      });
    }

    return stockHistory;
  }

  /**
   * Get sold stock report
   * Returns products with sold quantities, tax, and totals
   */
  async getSoldStock(
    companyId: string,
    filters: {
      branchId?: string;
      productId?: string;
      categoryId?: string;
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

    const sales = await (prisma as any).sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
                unit: true,
                images: true,
              },
            },
          },
        },
      },
    });

    // Group by product
    const productMap = new Map();

    sales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        if (filters.productId && item.productId !== filters.productId) {
          return;
        }
        if (filters.categoryId && item.product?.categoryId !== filters.categoryId) {
          return;
        }

        const productId = item.productId;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            SKU: item.product?.sku || 'N/A',
            Product_Name: item.product?.name || 'Unknown',
            img: item.product?.image || item.product?.images?.[0]?.url || '',
            Unit: item.product?.unit?.shortName || 'PC',
            Quantity: 0,
            Tax_Value: 0,
            Total: 0,
          });
        }

        const product = productMap.get(productId);
        product.Quantity += item.quantity || 0;
        product.Tax_Value += parseFloat(item.taxAmount?.toString() || '0');
        product.Total += parseFloat(item.totalAmount?.toString() || '0');
      });
    });

    // Format for frontend
    return Array.from(productMap.values()).map((p: any) => ({
      ...p,
      Quantity: p.Quantity.toString(),
      Tax_Value: `$${p.Tax_Value.toFixed(2)}`,
      Total: `$${p.Total.toFixed(2)}`,
    }));
  }

  /**
   * Get supplier report
   * Returns supplier purchase data with totals and payment methods
   */
  async getSupplierReport(
    companyId: string,
    filters: {
      branchId?: string;
      supplierId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
      paymentMethod?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase();
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

    const purchases = await (prisma as any).purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        items: true,
        payments: filters.paymentMethod ? {
          where: {
            paymentMethod: filters.paymentMethod,
          },
        } : true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return purchases.map((p: any) => ({
      Reference: p.referenceNumber || p.id,
      ID: p.id.substring(0, 8),
      Supplier: p.supplier?.name || 'N/A',
      image: p.supplier?.image || '',
      Total_Items: p.items?.length || 0,
      Amount: `$${parseFloat(p.totalAmount?.toString() || '0').toFixed(2)}`,
      Payment_Method: p.payments?.[0]?.paymentMethod || 'N/A',
      Status: p.status || 'PENDING',
    }));
  }

  /**
   * Get supplier due report
   * Returns suppliers with outstanding balances
   */
  async getSupplierDueReport(
    companyId: string,
    filters: {
      branchId?: string;
      supplierId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
      paymentMethod?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
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

    const purchases = await (prisma as any).purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate due amounts
    return purchases
      .filter((p: any) => {
        const totalPaid = p.payments?.reduce((sum: number, pay: any) => 
          sum + parseFloat(pay.amount?.toString() || '0'), 0
        ) || 0;
        const totalAmount = parseFloat(p.totalAmount?.toString() || '0');
        const due = totalAmount - totalPaid;
        
        if (filters.status === 'PAID' && due <= 0) return true;
        if (filters.status === 'OVERDUE' && due > 0) return true;
        if (!filters.status) return due > 0;
        return false;
      })
      .map((p: any) => {
        const totalPaid = p.payments?.reduce((sum: number, pay: any) => 
          sum + parseFloat(pay.amount?.toString() || '0'), 0
        ) || 0;
        const totalAmount = parseFloat(p.totalAmount?.toString() || '0');
        const due = totalAmount - totalPaid;
        const isOverdue = p.dueDate && new Date(p.dueDate) < new Date() && due > 0;

        return {
          Reference: p.referenceNumber || p.id,
          ID: p.id.substring(0, 8),
          Supplier: p.supplier?.name || 'N/A',
          image: p.supplier?.image || '',
          Total_Items: p.items?.length || 0,
          Amount: `$${totalAmount.toFixed(2)}`,
          Payment_Method: p.payments?.[0]?.paymentMethod || 'N/A',
          Status: isOverdue ? 'Overdue' : due > 0 ? 'Unpaid' : 'Paid',
        };
      });
  }

  /**
   * Get customer report
   * Returns customer sales data with totals and payment methods
   */
  async getCustomerReport(
    companyId: string,
    filters: {
      branchId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
      paymentStatus?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
      saleStatus: 'COMPLETED',
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
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

    const sales = await (prisma as any).sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        items: true,
        payments: filters.paymentMethod ? {
          where: {
            paymentMethod: filters.paymentMethod,
          },
        } : true,
      },
      orderBy: { saleDate: 'desc' },
    });

    // Group by customer
    const customerMap = new Map();

    sales.forEach((sale: any) => {
      if (filters.paymentStatus) {
        const paymentStatus = sale.paymentStatus || 'UNPAID';
        if (filters.paymentStatus.toUpperCase() !== paymentStatus) {
          return;
        }
      }

      const customerId = sale.customerId || 'unknown';
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          Reference: sale.saleNumber || sale.id,
          Code: sale.customer?.id?.substring(0, 8) || 'N/A',
          Customer: sale.customer?.name || 'Walk-in Customer',
          image: sale.customer?.image || '',
          Total_Orders: 0,
          Amount: 0,
          Payment_Method: sale.payments?.[0]?.paymentMethod || 'N/A',
          Status: sale.paymentStatus || 'UNPAID',
        });
      }

      const customer = customerMap.get(customerId);
      customer.Total_Orders += 1;
      customer.Amount += parseFloat(sale.totalAmount?.toString() || '0');
    });

    return Array.from(customerMap.values()).map((c: any) => ({
      ...c,
      Amount: `$${c.Amount.toFixed(2)}`,
      Status: c.Status === 'PAID' ? 'Completed' : 'Unpaid',
    }));
  }

  /**
   * Get customer due report
   * Returns customers with outstanding balances
   */
  async getCustomerDueReport(
    companyId: string,
    filters: {
      branchId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
      paymentStatus?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
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

    const sales = await (prisma as any).sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        items: true,
        payments: true,
      },
      orderBy: { saleDate: 'desc' },
    });

    // Group by customer and calculate due
    const customerMap = new Map();

    sales.forEach((sale: any) => {
      const totalPaid = sale.payments?.reduce((sum: number, pay: any) => 
        sum + parseFloat(pay.amount?.toString() || '0'), 0
      ) || 0;
      const totalAmount = parseFloat(sale.totalAmount?.toString() || '0');
      const due = totalAmount - totalPaid;

      if (due <= 0 && filters.paymentStatus !== 'ALL') {
        return; // Skip paid sales
      }

      const customerId = sale.customerId || 'unknown';
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          Reference: sale.saleNumber || sale.id,
          Code: sale.customer?.id?.substring(0, 8) || 'N/A',
          Customer: sale.customer?.name || 'Walk-in Customer',
          image: sale.customer?.image || '',
          Total_Orders: 0,
          Amount: 0,
          Payment_Method: sale.payments?.[0]?.paymentMethod || 'N/A',
          Status: due > 0 ? (sale.dueDate && new Date(sale.dueDate) < new Date() ? 'Overdue' : 'Unpaid') : 'Paid',
        });
      }

      const customer = customerMap.get(customerId);
      customer.Total_Orders += 1;
      customer.Amount += due;
    });

    return Array.from(customerMap.values()).map((c: any) => ({
      ...c,
      Amount: `$${c.Amount.toFixed(2)}`,
    }));
  }

  /**
   * Get product report
   * Returns products with sales data, revenue, and stock info
   */
  async getProductReport(
    companyId: string,
    filters: {
      branchId?: string;
      productId?: string;
      categoryId?: string;
      brandId?: string;
      storeId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const productWhere: any = { tenantId: companyId };
    if (filters.categoryId) productWhere.categoryId = filters.categoryId;
    if (filters.brandId) productWhere.brandId = filters.brandId;
    if (filters.productId) productWhere.id = filters.productId;

    const products = await (prisma as any).product.findMany({
      where: productWhere,
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    const saleWhere: any = {
      tenantId: companyId,
      saleStatus: 'COMPLETED',
    };
    if (filters.branchId) saleWhere.branchId = filters.branchId;
    if (filters.startDate || filters.endDate) {
      saleWhere.saleDate = {};
      if (filters.startDate) saleWhere.saleDate.gte = filters.startDate;
      if (filters.endDate) saleWhere.saleDate.lte = filters.endDate;
    }

    const sales = await (prisma as any).sale.findMany({
      where: saleWhere,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Group sales by product
    const productSales = new Map();
    sales.forEach((sale: any) => {
      sale.items.forEach((item: any) => {
        const productId = item.productId;
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            totalOrdered: 0,
            revenue: 0,
          });
        }
        const data = productSales.get(productId);
        data.totalOrdered += item.quantity || 0;
        data.revenue += parseFloat(item.totalAmount?.toString() || '0');
      });
    });

    // Get stock quantities
    const stockWhere: any = { product: { tenantId: companyId } };
    if (filters.branchId) stockWhere.branchId = filters.branchId;
    if (filters.storeId) stockWhere.warehouseId = filters.storeId;

    const stocks = await (prisma as any).stock.findMany({
      where: stockWhere,
    });

    const productStock = new Map();
    stocks.forEach((stock: any) => {
      if (!productStock.has(stock.productId)) {
        productStock.set(stock.productId, 0);
      }
      productStock.set(stock.productId, productStock.get(stock.productId) + (stock.quantity || 0));
    });

    return products.map((product: any) => {
      const salesData = productSales.get(product.id) || { totalOrdered: 0, revenue: 0 };
      const stockQty = productStock.get(product.id) || 0;

      return {
        SKU: product.sku,
        Product_Name: product.name,
        image: product.image || product.images?.[0]?.url || '',
        Category: product.category?.name || 'N/A',
        Brand: product.brand?.name || 'N/A',
        Qty: stockQty.toString(),
        Price: `$${parseFloat(product.price?.toString() || '0').toFixed(2)}`,
        Total_Ordered: salesData.totalOrdered.toString(),
        Revenue: `$${salesData.revenue.toFixed(2)}`,
      };
    });
  }

  /**
   * Get product expiry report
   * Returns products that are expired or expiring soon
   */
  async getProductExpiryReport(
    companyId: string,
    filters: {
      branchId?: string;
      productId?: string;
      categoryId?: string;
      brandId?: string;
      storeId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const productWhere: any = {
      tenantId: companyId,
      expiryDate: { not: null },
    };

    if (filters.categoryId) productWhere.categoryId = filters.categoryId;
    if (filters.brandId) productWhere.brandId = filters.brandId;
    if (filters.productId) productWhere.id = filters.productId;

    if (filters.startDate || filters.endDate) {
      productWhere.expiryDate = {};
      if (filters.startDate) productWhere.expiryDate.gte = filters.startDate;
      if (filters.endDate) productWhere.expiryDate.lte = filters.endDate;
    }

    const products = await (prisma as any).product.findMany({
      where: productWhere,
      include: {
        category: true,
        brand: true,
        images: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    return products.map((product: any) => ({
      SKU: product.sku,
      Serial_No: product.barcode || product.sku,
      Product_Name: product.name,
      image: product.image || product.images?.[0]?.url || '',
      Manufactured_Date: product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB') : 'N/A',
      Expired_Date: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-GB') : 'N/A',
    }));
  }

  /**
   * Get product quantity alert report
   * Returns products with low stock (below minStock threshold)
   */
  async getProductQuantityAlert(
    companyId: string,
    filters: {
      branchId?: string;
      productId?: string;
      categoryId?: string;
      brandId?: string;
      storeId?: string;
    }
  ) {
    const productWhere: any = { tenantId: companyId };
    if (filters.categoryId) productWhere.categoryId = filters.categoryId;
    if (filters.brandId) productWhere.brandId = filters.brandId;
    if (filters.productId) productWhere.id = filters.productId;

    const products = await (prisma as any).product.findMany({
      where: productWhere,
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    const stockWhere: any = { product: { tenantId: companyId } };
    if (filters.branchId) stockWhere.branchId = filters.branchId;
    if (filters.storeId) stockWhere.warehouseId = filters.storeId;

    const stocks = await (prisma as any).stock.findMany({
      where: stockWhere,
    });

    const productStock = new Map();
    stocks.forEach((stock: any) => {
      if (!productStock.has(stock.productId)) {
        productStock.set(stock.productId, 0);
      }
      productStock.set(stock.productId, productStock.get(stock.productId) + (stock.quantity || 0));
    });

    return products
      .filter((product: any) => {
        const stockQty = productStock.get(product.id) || 0;
        const minStock = product.minStock || 0;
        return stockQty <= minStock;
      })
      .map((product: any) => {
        const stockQty = productStock.get(product.id) || 0;
        const alertQty = product.minStock || 0;

        return {
          SKU: product.sku,
          Serial_No: product.barcode || product.sku,
          Product_Name: product.name,
          image: product.image || product.images?.[0]?.url || '',
          Total_Quantity: stockQty.toString(),
          Alert_Quantity: alertQty.toString(),
        };
      });
  }

  /**
   * Get expense report
   * Returns expenses with category, amount, and status
   */
  async getExpenseReport(
    companyId: string,
    filters: {
      branchId?: string;
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
      paymentMethod?: string;
    }
  ) {
    const where: any = { tenantId: companyId };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status.toUpperCase();

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const expenses = await (prisma as any).expense.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Filter by payment method if provided
    let filteredExpenses = expenses;
    if (filters.paymentMethod) {
      // Assuming expenses have paymentMethod field or related payment
      filteredExpenses = expenses.filter((e: any) => 
        e.paymentMethod === filters.paymentMethod
      );
    }

    return filteredExpenses.map((exp: any) => ({
      Expense_Name: exp.name || exp.title || 'N/A',
      Category: exp.category?.name || 'Uncategorized',
      Description: exp.description || 'N/A',
      Date: exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : 'N/A',
      Amount: `$${parseFloat(exp.amount?.toString() || '0').toFixed(2)}`,
      Status: exp.status || 'PENDING',
    }));
  }

  /**
   * Get income report
   * Returns income records with category, store, and payment method
   */
  async getIncomeReport(
    companyId: string,
    filters: {
      branchId?: string;
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
    }
  ) {
    const where: any = { tenantId: companyId };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const incomes = await (prisma as any).income.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Filter by payment method if provided
    let filteredIncomes = incomes;
    if (filters.paymentMethod) {
      filteredIncomes = incomes.filter((i: any) => 
        i.paymentMethod === filters.paymentMethod
      );
    }

    return filteredIncomes.map((inc: any) => ({
      Reference: inc.reference || inc.id.substring(0, 8),
      Date: inc.date ? new Date(inc.date).toLocaleDateString('en-GB') : 'N/A',
      Store: inc.branchId || 'N/A',
      Category: inc.category?.name || 'Uncategorized',
      Notes: inc.notes || inc.description || 'N/A',
      Amount: `$${parseFloat(inc.amount?.toString() || '0').toFixed(2)}`,
      Payment_Method: inc.paymentMethod || 'N/A',
    }));
  }

  /**
   * Get purchase tax report
   * Returns purchase transactions with tax amounts
   */
  async getPurchaseTaxReport(
    companyId: string,
    filters: {
      branchId?: string;
      supplierId?: string;
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
    }
  ) {
    const where: any = { tenantId: companyId };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.supplierId) where.supplierId = filters.supplierId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const purchases = await (prisma as any).purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
        payments: filters.paymentMethod ? {
          where: {
            paymentMethod: filters.paymentMethod,
          },
        } : true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return purchases.map((p: any) => {
      const totalTax = p.items?.reduce((sum: number, item: any) => 
        sum + parseFloat(item.taxAmount?.toString() || '0'), 0
      ) || 0;

      return {
        Reference: p.referenceNumber || p.id.substring(0, 8),
        Supplier: p.supplier?.name || 'N/A',
        Date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : 'N/A',
        Store: p.branchId || 'N/A',
        Amount: `$${parseFloat(p.totalAmount?.toString() || '0').toFixed(2)}`,
        Payment_Method: p.payments?.[0]?.paymentMethod || 'N/A',
        Discount: `$${parseFloat(p.discountAmount?.toString() || '0').toFixed(2)}`,
        Tax_Amount: `$${totalTax.toFixed(2)}`,
      };
    });
  }

  /**
   * Get sales tax report
   * Returns sales transactions with tax amounts
   */
  async getSalesTaxReport(
    companyId: string,
    filters: {
      branchId?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
    }
  ) {
    const where: any = {
      tenantId: companyId,
      saleStatus: 'COMPLETED',
    };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.customerId) where.customerId = filters.customerId;

    if (filters.startDate || filters.endDate) {
      where.saleDate = {};
      if (filters.startDate) where.saleDate.gte = filters.startDate;
      if (filters.endDate) where.saleDate.lte = filters.endDate;
    }

    const sales = await (prisma as any).sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
        payments: filters.paymentMethod ? {
          where: {
            paymentMethod: filters.paymentMethod,
          },
        } : true,
      },
      orderBy: { saleDate: 'desc' },
    });

    return sales.map((s: any) => {
      const totalTax = s.items?.reduce((sum: number, item: any) => 
        sum + parseFloat(item.taxAmount?.toString() || '0'), 0
      ) || 0;

      return {
        Reference: s.saleNumber || s.id.substring(0, 8),
        Customer: s.customer?.name || 'Walk-in Customer',
        Date: s.saleDate ? new Date(s.saleDate).toLocaleDateString('en-GB') : 'N/A',
        Store: s.branchId || 'N/A',
        Amount: `$${parseFloat(s.totalAmount?.toString() || '0').toFixed(2)}`,
        Payment_Method: s.payments?.[0]?.paymentMethod || 'N/A',
        Discount: `$${parseFloat(s.discountAmount?.toString() || '0').toFixed(2)}`,
        Tax_Amount: `$${totalTax.toFixed(2)}`,
      };
    });
  }

  /**
   * Get profit/loss report
   * Returns monthly profit and loss data
   */
  async getProfitLossReport(
    companyId: string,
    filters: {
      branchId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    // Get sales (income)
    const saleWhere: any = {
      tenantId: companyId,
      saleStatus: 'COMPLETED',
      saleDate: { gte: startDate, lte: endDate },
    };
    if (filters.branchId) saleWhere.branchId = filters.branchId;

    const sales = await (prisma as any).sale.findMany({
      where: saleWhere,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Get purchases (expenses)
    const purchaseWhere: any = {
      tenantId: companyId,
      status: 'RECEIVED',
      createdAt: { gte: startDate, lte: endDate },
    };
    if (filters.branchId) purchaseWhere.branchId = filters.branchId;

    const purchases = await (prisma as any).purchase.findMany({
      where: purchaseWhere,
      include: {
        items: true,
      },
    });

    // Get expenses
    const expenseWhere: any = {
      tenantId: companyId,
      date: { gte: startDate, lte: endDate },
    };
    if (filters.branchId) expenseWhere.branchId = filters.branchId;

    const expenses = await (prisma as any).expense.findMany({
      where: expenseWhere,
    });

    // Get purchase returns (income)
    const purchaseReturnWhere: any = {
      tenantId: companyId,
      createdAt: { gte: startDate, lte: endDate },
    };
    if (filters.branchId) purchaseReturnWhere.branchId = filters.branchId;

    const purchaseReturns = await (prisma as any).purchaseReturn.findMany({
      where: purchaseReturnWhere,
    });

    // Get sales returns (expense)
    const salesReturnWhere: any = {
      tenantId: companyId,
      createdAt: { gte: startDate, lte: endDate },
    };
    if (filters.branchId) salesReturnWhere.branchId = filters.branchId;

    const salesReturns = await (prisma as any).salesReturn.findMany({
      where: salesReturnWhere,
    });

    // Group by month
    const monthlyData = new Map();

    // Process sales
    sales.forEach((sale: any) => {
      const month = new Date(sale.saleDate).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          sales: 0,
          service: 0,
          purchaseReturn: 0,
          grossProfit: 0,
          purchase: 0,
          salesReturn: 0,
          totalExpense: 0,
          netProfit: 0,
        });
      }
      const data = monthlyData.get(month);
      data.sales += parseFloat(sale.totalAmount?.toString() || '0');
    });

    // Process expenses
    expenses.forEach((exp: any) => {
      const month = new Date(exp.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          sales: 0,
          service: 0,
          purchaseReturn: 0,
          grossProfit: 0,
          purchase: 0,
          salesReturn: 0,
          totalExpense: 0,
          netProfit: 0,
        });
      }
      const data = monthlyData.get(month);
      data.totalExpense += parseFloat(exp.amount?.toString() || '0');
    });

    // Process purchases
    purchases.forEach((p: any) => {
      const month = new Date(p.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          sales: 0,
          service: 0,
          purchaseReturn: 0,
          grossProfit: 0,
          purchase: 0,
          salesReturn: 0,
          totalExpense: 0,
          netProfit: 0,
        });
      }
      const data = monthlyData.get(month);
      data.purchase += parseFloat(p.totalAmount?.toString() || '0');
    });

    // Process purchase returns
    purchaseReturns.forEach((pr: any) => {
      const month = new Date(pr.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          sales: 0,
          service: 0,
          purchaseReturn: 0,
          grossProfit: 0,
          purchase: 0,
          salesReturn: 0,
          totalExpense: 0,
          netProfit: 0,
        });
      }
      const data = monthlyData.get(month);
      data.purchaseReturn += parseFloat(pr.totalAmount?.toString() || '0');
    });

    // Process sales returns
    salesReturns.forEach((sr: any) => {
      const month = new Date(sr.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          sales: 0,
          service: 0,
          purchaseReturn: 0,
          grossProfit: 0,
          purchase: 0,
          salesReturn: 0,
          totalExpense: 0,
          netProfit: 0,
        });
      }
      const data = monthlyData.get(month);
      data.salesReturn += parseFloat(sr.totalAmount?.toString() || '0');
    });

    // Calculate gross profit, total expense, and net profit for each month
    monthlyData.forEach((data: any, month: string) => {
      data.grossProfit = data.sales + data.service + data.purchaseReturn - data.purchase - data.salesReturn;
      data.totalExpense = data.purchase + data.salesReturn + data.totalExpense;
      data.netProfit = data.grossProfit - data.totalExpense;
    });

    return Array.from(monthlyData.entries()).map(([month, data]: [string, any]) => ({
      month,
      sales: `$${data.sales.toFixed(2)}`,
      service: `$${data.service.toFixed(2)}`,
      purchaseReturn: `$${data.purchaseReturn.toFixed(2)}`,
      grossProfit: `$${data.grossProfit.toFixed(2)}`,
      purchase: `$${data.purchase.toFixed(2)}`,
      salesReturn: `$${data.salesReturn.toFixed(2)}`,
      totalExpense: `$${data.totalExpense.toFixed(2)}`,
      netProfit: `$${data.netProfit.toFixed(2)}`,
    }));
  }

  /**
   * Get annual report
   * Returns yearly summary data grouped by month
   */
  async getAnnualReport(
    companyId: string,
    filters: {
      branchId?: string;
      year?: number;
    }
  ) {
    const year = filters.year || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const saleWhere: any = {
      tenantId: companyId,
      saleStatus: 'COMPLETED',
      saleDate: { gte: startDate, lte: endDate },
    };
    if (filters.branchId) saleWhere.branchId = filters.branchId;

    const sales = await (prisma as any).sale.findMany({
      where: saleWhere,
    });

    // Group by month
    const monthlyData = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    months.forEach((month, index) => {
      monthlyData.set(`${month} ${year}`, {
        month: `${month} ${year}`,
        amount: 0,
      });
    });

    sales.forEach((sale: any) => {
      const month = new Date(sale.saleDate).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyData.has(month)) {
        monthlyData.get(month).amount += parseFloat(sale.totalAmount?.toString() || '0');
      }
    });

    return Array.from(monthlyData.values()).map((data: any) => ({
      month: data.month,
      amount: `$${data.amount.toFixed(2)}`,
    }));
  }
}

export default new ReportService();

