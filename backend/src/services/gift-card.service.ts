import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const giftCardCreateSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).optional(),
  customerId: z.string().uuid().optional(),
  issuedDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'REDEEMED', 'EXPIRED']).optional().default('ACTIVE'),
});

export const giftCardUpdateSchema = giftCardCreateSchema.partial().omit({ code: true });

export class GiftCardService {
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Generate gift card code
  private async generateCode(tenantId: string): Promise<string> {
    const count = await prisma.giftCard.count({ where: { tenantId } });
    return `GFT${String(count + 1).padStart(4, '0')}`;
  }

  // Transform for frontend (matches GiftData.jsx structure)
  private transformGiftCard(giftCard: any): any {
    return {
      id: giftCard.id,
      GiftCard: giftCard.code,
      Customer: giftCard.customer?.name || 'No Customer',
      IssuedDate: this.formatDate(giftCard.issuedDate),
      ExpiryDate: this.formatDate(giftCard.expiryDate),
      Amount: `$${Number(giftCard.amount).toFixed(0)}`,
      Balance: `$${Number(giftCard.balance).toFixed(0)}`,
      Status: giftCard.status === 'ACTIVE' ? 'Active' : 
              giftCard.status === 'REDEEMED' ? 'Redeemed' :
              giftCard.status === 'EXPIRED' ? 'Expired' : 'Inactive',
      Image: giftCard.customer?.avatar || 'src/assets/img/users/user-27.jpg',
      // Raw values
      _amount: Number(giftCard.amount),
      _balance: Number(giftCard.balance),
      _status: giftCard.status,
      customer: giftCard.customer,
    };
  }

  /**
   * Get all gift cards
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      customerId?: string;
      status?: string;
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

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [giftCards, total] = await Promise.all([
      prisma.giftCard.findMany({
        where,
        include: {
          customer: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.giftCard.count({ where }),
    ]);

    return {
      data: giftCards.map(giftCard => this.transformGiftCard(giftCard)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single gift card
   */
  async findOne(tenantId: string, id: string) {
    const giftCard = await prisma.giftCard.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
      },
    });

    if (!giftCard) {
      throw new AppErrorClass('Gift card not found', 404, 'GIFT_CARD_NOT_FOUND');
    }

    return this.transformGiftCard(giftCard);
  }

  /**
   * Create gift card
   */
  async create(tenantId: string, data: z.infer<typeof giftCardCreateSchema>) {
    const validated = giftCardCreateSchema.parse(data);

    // Generate code if not provided
    let code = validated.code;
    if (!code) {
      code = await this.generateCode(tenantId);
    } else {
      // Check if code already exists
      const existing = await prisma.giftCard.findFirst({
        where: { tenantId, code },
      });

      if (existing) {
        throw new AppErrorClass('Gift card code already exists', 400, 'CODE_EXISTS');
      }
    }

    // Validate dates
    const issuedDate = new Date(validated.issuedDate);
    const expiryDate = new Date(validated.expiryDate);
    if (expiryDate <= issuedDate) {
      throw new AppErrorClass('Expiry date must be after issued date', 400, 'INVALID_DATES');
    }

    const giftCard = await prisma.giftCard.create({
      data: {
        tenantId,
        code,
        customerId: validated.customerId,
        issuedDate,
        expiryDate,
        amount: validated.amount,
        balance: validated.amount, // Initial balance equals amount
        status: validated.status || 'ACTIVE',
      },
      include: {
        customer: true,
      },
    });

    return this.transformGiftCard(giftCard);
  }

  /**
   * Update gift card
   */
  async update(tenantId: string, id: string, data: z.infer<typeof giftCardUpdateSchema>) {
    const validated = giftCardUpdateSchema.parse(data);

    const existing = await prisma.giftCard.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Gift card not found', 404, 'GIFT_CARD_NOT_FOUND');
    }

    // Validate dates if provided
    if (validated.issuedDate && validated.expiryDate) {
      const issuedDate = new Date(validated.issuedDate);
      const expiryDate = new Date(validated.expiryDate);
      if (expiryDate <= issuedDate) {
        throw new AppErrorClass('Expiry date must be after issued date', 400, 'INVALID_DATES');
      }
    }

    // Check expiry status
    const now = new Date();
    if (existing.expiryDate < now && existing.status === 'ACTIVE') {
      validated.status = 'EXPIRED';
    }

    const updateData: any = {};
    if (validated.customerId !== undefined) updateData.customerId = validated.customerId;
    if (validated.issuedDate) updateData.issuedDate = new Date(validated.issuedDate);
    if (validated.expiryDate) updateData.expiryDate = new Date(validated.expiryDate);
    if (validated.amount !== undefined) {
      updateData.amount = validated.amount;
      // If amount is updated and balance hasn't been used, update balance too
      if (existing.balance === existing.amount) {
        updateData.balance = validated.amount;
      }
    }
    if (validated.status) updateData.status = validated.status;

    const giftCard = await prisma.giftCard.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
      },
    });

    return this.transformGiftCard(giftCard);
  }

  /**
   * Delete gift card
   */
  async delete(tenantId: string, id: string) {
    const existing = await prisma.giftCard.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Gift card not found', 404, 'GIFT_CARD_NOT_FOUND');
    }

    await prisma.giftCard.delete({ where: { id } });
    return { message: 'Gift card deleted successfully' };
  }

  /**
   * Redeem gift card (deduct balance)
   */
  async redeem(tenantId: string, id: string, amount: number) {
    const giftCard = await prisma.giftCard.findFirst({
      where: { id, tenantId },
    });

    if (!giftCard) {
      throw new AppErrorClass('Gift card not found', 404, 'GIFT_CARD_NOT_FOUND');
    }

    if (giftCard.status !== 'ACTIVE') {
      throw new AppErrorClass('Gift card is not active', 400, 'GIFT_CARD_INACTIVE');
    }

    const now = new Date();
    if (giftCard.expiryDate < now) {
      throw new AppErrorClass('Gift card has expired', 400, 'GIFT_CARD_EXPIRED');
    }

    if (Number(giftCard.balance) < amount) {
      throw new AppErrorClass('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
    }

    const newBalance = Number(giftCard.balance) - amount;
    const status = newBalance === 0 ? 'REDEEMED' : 'ACTIVE';

    const updated = await prisma.giftCard.update({
      where: { id },
      data: {
        balance: newBalance,
        status,
      },
      include: {
        customer: true,
      },
    });

    return this.transformGiftCard(updated);
  }
}

export default new GiftCardService();

