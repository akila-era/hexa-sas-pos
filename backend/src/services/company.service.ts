import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { companyCreateSchema, companyUpdateSchema } from '../utils/validation';
import { z } from 'zod';

export class CompanyService {
  async create(data: z.infer<typeof companyCreateSchema>) {
    const validated = companyCreateSchema.parse(data);

    // Check if company with this name already exists
    const existing = await (prisma as any).tenant.findFirst({
      where: { name: validated.name },
    });

    if (existing) {
      throw new AppErrorClass('Company with this name already exists', 409, 'COMPANY_EXISTS');
    }

    // Only use fields that exist in the Tenant model
    const company = await (prisma as any).tenant.create({
      data: {
        name: validated.name,
        plan: 'FREE', // Default plan
        isActive: true,
      },
    });

    return company;
  }

  async findAll(filters: { page?: number; limit?: number; isActive?: boolean }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [companies, total] = await Promise.all([
      (prisma as any).tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).tenant.count({ where }),
    ]);

    return {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const company = await (prisma as any).tenant.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: {
          select: {
            users: true,
            products: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppErrorClass('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    return company;
  }

  async update(id: string, data: z.infer<typeof companyUpdateSchema>) {
    const validated = companyUpdateSchema.parse(data);

    const company = await (prisma as any).tenant.findUnique({
      where: { id },
    });

    if (!company) {
      throw new AppErrorClass('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Build update data object with all allowed fields
    const updateData: any = {};
    
    // Basic fields
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.email !== undefined) updateData.email = validated.email;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.address !== undefined) updateData.address = validated.address;
    if (validated.website !== undefined) updateData.website = validated.website;
    
    // Tenant-specific fields
    if (validated.plan !== undefined) updateData.plan = validated.plan;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.accountUrl !== undefined) updateData.accountUrl = validated.accountUrl;
    if (validated.currency !== undefined) updateData.currency = validated.currency;
    if (validated.language !== undefined) updateData.language = validated.language;

    const updated = await (prisma as any).tenant.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }
}

export default new CompanyService();
