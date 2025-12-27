import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { paginationSchema } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
export const billerCreateSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  companyName: z.string().min(1, 'Company name is required').max(255),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

export const billerUpdateSchema = billerCreateSchema.partial().omit({ code: true });

export class BillerService {
  // Generate biller code
  private async generateCode(tenantId: string): Promise<string> {
    const count = await prisma.biller.count({ where: { tenantId } });
    return `BI${String(count + 1).padStart(3, '0')}`;
  }

  // Transform for frontend (matches billersData.js structure)
  private transformBiller(biller: any): any {
    return {
      id: biller.id,
      code: biller.code,
      biller: `${biller.firstName} ${biller.lastName}`,
      company: biller.companyName,
      email: biller.email || '',
      phone: biller.phone || '',
      country: biller.country || '',
      status: biller.isActive ? 'Active' : 'Inactive',
      avatar: biller.avatar || 'src/assets/img/users/user-27.jpg',
      // Raw values
      firstName: biller.firstName,
      lastName: biller.lastName,
      companyName: biller.companyName,
      address: biller.address,
      city: biller.city,
      state: biller.state,
      postalCode: biller.postalCode,
      isActive: biller.isActive,
    };
  }

  /**
   * Get all billers
   */
  async findAll(
    tenantId: string,
    filters: z.infer<typeof paginationSchema> & {
      status?: string;
      search?: string;
      country?: string;
    }
  ) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.status) {
      where.isActive = filters.status.toLowerCase() === 'active';
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [billers, total] = await Promise.all([
      prisma.biller.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.biller.count({ where }),
    ]);

    return {
      data: billers.map(biller => this.transformBiller(biller)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single biller
   */
  async findOne(tenantId: string, id: string) {
    const biller = await prisma.biller.findFirst({
      where: { id, tenantId },
    });

    if (!biller) {
      throw new AppErrorClass('Biller not found', 404, 'BILLER_NOT_FOUND');
    }

    return this.transformBiller(biller);
  }

  /**
   * Create biller
   */
  async create(tenantId: string, data: z.infer<typeof billerCreateSchema>) {
    const validated = billerCreateSchema.parse(data);

    // Generate code if not provided
    let code = validated.code;
    if (!code) {
      code = await this.generateCode(tenantId);
    } else {
      // Check if code already exists
      const existing = await prisma.biller.findFirst({
        where: { tenantId, code },
      });

      if (existing) {
        throw new AppErrorClass('Biller code already exists', 400, 'CODE_EXISTS');
      }
    }

    // Check if email already exists (if provided)
    if (validated.email) {
      const emailExists = await prisma.biller.findFirst({
        where: { tenantId, email: validated.email },
      });

      if (emailExists) {
        throw new AppErrorClass('Email already exists', 400, 'EMAIL_EXISTS');
      }
    }

    const biller = await prisma.biller.create({
      data: {
        tenantId,
        code,
        firstName: validated.firstName,
        lastName: validated.lastName,
        companyName: validated.companyName,
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        country: validated.country || null,
        postalCode: validated.postalCode || null,
        avatar: validated.avatar || null,
        isActive: validated.isActive ?? true,
      },
    });

    return this.transformBiller(biller);
  }

  /**
   * Update biller
   */
  async update(tenantId: string, id: string, data: z.infer<typeof billerUpdateSchema>) {
    const validated = billerUpdateSchema.parse(data);

    const existing = await prisma.biller.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Biller not found', 404, 'BILLER_NOT_FOUND');
    }

    // Check if email already exists (if provided and changed)
    if (validated.email && validated.email !== existing.email) {
      const emailExists = await prisma.biller.findFirst({
        where: { tenantId, email: validated.email },
      });

      if (emailExists) {
        throw new AppErrorClass('Email already exists', 400, 'EMAIL_EXISTS');
      }
    }

    const updateData: any = {};
    if (validated.firstName) updateData.firstName = validated.firstName;
    if (validated.lastName) updateData.lastName = validated.lastName;
    if (validated.companyName) updateData.companyName = validated.companyName;
    if (validated.email !== undefined) updateData.email = validated.email || null;
    if (validated.phone !== undefined) updateData.phone = validated.phone || null;
    if (validated.address !== undefined) updateData.address = validated.address || null;
    if (validated.city !== undefined) updateData.city = validated.city || null;
    if (validated.state !== undefined) updateData.state = validated.state || null;
    if (validated.country !== undefined) updateData.country = validated.country || null;
    if (validated.postalCode !== undefined) updateData.postalCode = validated.postalCode || null;
    if (validated.avatar !== undefined) updateData.avatar = validated.avatar || null;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const biller = await prisma.biller.update({
      where: { id },
      data: updateData,
    });

    return this.transformBiller(biller);
  }

  /**
   * Delete biller
   */
  async delete(tenantId: string, id: string) {
    const existing = await prisma.biller.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppErrorClass('Biller not found', 404, 'BILLER_NOT_FOUND');
    }

    await prisma.biller.delete({ where: { id } });
    return { message: 'Biller deleted successfully' };
  }
}

export default new BillerService();

