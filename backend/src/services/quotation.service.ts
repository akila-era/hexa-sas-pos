import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const quotationCreateSchema = z.object({
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
  validUntil: z.string().optional(),
  note: z.string().optional(),
  terms: z.string().optional(),
});

export const quotationUpdateSchema = quotationCreateSchema.partial();

export class QuotationService {
  // Format date for frontend
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Generate quotation number
  private async generateQuotationNumber(tenantId: string): Promise<string> {
    const count = await (prisma as any).quotation.count({ where: { tenantId } });
    return `QT${String(count + 1).padStart(4, '0')}`;
  }

  // Transform for frontend
  private transformQuotation(q: any): any {
    const product = q.items?.[0]?.product;
    return {
      id: q.id,
      Product_Name: product?.name || 'Multiple Products',
      Product_image: product?.image || 'stock-img-01.png',
      Custmer_Name: q.customer?.name || 'Walk-in Customer',
      Custmer_Image: q.customer?.avatar || 'user-27.jpg',
      Status: q.status === 'SENT' ? 'Sent' : q.status === 'ACCEPTED' || q.status === 'CONVERTED' ? 'Ordered' : 'Pending',
      Total: `$${Number(q.total).toFixed(0)}`,
      quotationNumber: q.quotationNumber,
      validUntil: q.validUntil ? this.formatDate(q.validUntil) : null,
      note: q.note,
      terms: q.terms,
      // Relations
      customer: q.customer,
      items: q.items?.map((item: any) => ({
        id: item.id,
        product: item.product,
        qty: item.qty,
        price: Number(item.price),
        discount: Number(item.discount),
        tax: Number(item.tax),
        total: Number(item.total),
      })),
    };
  }

  /**
   * Get all quotations
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      customerId?: string;
      status?: string;
      productId?: string;
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
      where.status = filters.status.toUpperCase();
    }

    if (filters.productId) {
      where.items = { some: { productId: filters.productId } };
    }

    if (filters.search) {
      where.OR = [
        { quotationNumber: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [quotations, total] = await Promise.all([
      (prisma as any).quotation.findMany({
        where,
        include: {
          items: { include: { product: true } },
          customer: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).quotation.count({ where }),
    ]);

    return {
      data: quotations.map((q: any) => this.transformQuotation(q)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single quotation
   */
  async findOne(tenantId: string, id: string) {
    const quotation = await (prisma as any).quotation.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (!quotation) {
      throw new AppErrorClass('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
    }

    return this.transformQuotation(quotation);
  }

  /**
   * Create quotation
   */
  async create(tenantId: string, userId: string, data: z.infer<typeof quotationCreateSchema>) {
    const validated = quotationCreateSchema.parse(data);
    const quotationNumber = await this.generateQuotationNumber(tenantId);

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

    const quotation = await (prisma as any).quotation.create({
      data: {
        tenantId,
        customerId: validated.customerId,
        quotationNumber,
        subtotal,
        taxAmount,
        discount,
        total,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
        status: 'DRAFT',
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
      },
    });

    return this.transformQuotation(quotation);
  }

  /**
   * Update quotation
   */
  async update(tenantId: string, id: string, data: z.infer<typeof quotationUpdateSchema>) {
    const validated = quotationUpdateSchema.parse(data);

    const existing = await (prisma as any).quotation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
    }

    const updateData: any = {};
    if (validated.customerId) updateData.customerId = validated.customerId;
    if (validated.note !== undefined) updateData.note = validated.note;
    if (validated.terms !== undefined) updateData.terms = validated.terms;
    if (validated.validUntil) updateData.validUntil = new Date(validated.validUntil);

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

      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.discount = discount;
      updateData.total = total;

      // Delete and recreate items
      await (prisma as any).quotationItem.deleteMany({ where: { quotationId: id } });
      await (prisma as any).quotationItem.createMany({
        data: itemsWithTotal.map(item => ({
          quotationId: id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.total,
        })),
      });
    }

    const quotation = await (prisma as any).quotation.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    return this.transformQuotation(quotation);
  }

  /**
   * Update quotation status
   */
  async updateStatus(tenantId: string, id: string, status: string) {
    const existing = await (prisma as any).quotation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
    }

    const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new AppErrorClass('Invalid status', 400, 'INVALID_STATUS');
    }

    const quotation = await (prisma as any).quotation.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    return this.transformQuotation(quotation);
  }

  /**
   * Convert quotation to sale
   */
  async convertToSale(tenantId: string, id: string, userId: string, branchId: string) {
    const quotation = await (prisma as any).quotation.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (!quotation) {
      throw new AppErrorClass('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
    }

    if (quotation.status === 'CONVERTED') {
      throw new AppErrorClass('Quotation already converted', 400, 'ALREADY_CONVERTED');
    }

    // Create POS order
    const posOrder = await (prisma as any).pOSOrder.create({
      data: {
        tenantId,
        branchId,
        cashierId: userId,
        customerId: quotation.customerId,
        subtotal: quotation.subtotal,
        taxAmount: quotation.taxAmount,
        discount: quotation.discount,
        total: quotation.total,
        paidAmount: 0,
        changeAmount: 0,
        payment: 'PENDING',
        status: 'COMPLETED',
        items: {
          create: quotation.items.map((item: any) => ({
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            tax: item.tax,
            total: item.total,
          })),
        },
      },
    });

    // Create sale
    const saleCount = await (prisma as any).sale.count({ where: { tenantId } });
    const invoiceNumber = `SL${String(saleCount + 1).padStart(4, '0')}`;

    const sale = await (prisma as any).sale.create({
      data: {
        tenantId,
        branchId,
        posOrderId: posOrder.id,
        customerId: quotation.customerId,
        creatorId: userId,
        invoiceNumber,
        subtotal: quotation.subtotal,
        taxAmount: quotation.taxAmount,
        discount: quotation.discount,
        total: quotation.total,
        paidAmount: 0,
        dueAmount: quotation.total,
        paymentStatus: 'UNPAID',
        status: 'COMPLETED',
        items: {
          create: quotation.items.map((item: any) => ({
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            tax: item.tax,
            total: item.total,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    // Update quotation status
    await (prisma as any).quotation.update({
      where: { id },
      data: { 
        status: 'CONVERTED',
        convertedToSale: sale.id,
      },
    });

    return {
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      message: 'Quotation converted to sale successfully',
    };
  }

  /**
   * Delete quotation
   */
  async delete(tenantId: string, id: string) {
    const existing = await (prisma as any).quotation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Quotation not found', 404, 'QUOTATION_NOT_FOUND');
    }

    await (prisma as any).quotation.delete({ where: { id } });
    return { message: 'Quotation deleted successfully' };
  }
}

export default new QuotationService();
