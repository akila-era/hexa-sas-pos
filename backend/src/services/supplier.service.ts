import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface SupplierQuery {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateSupplierData {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
  contactPerson?: string;
  isActive?: boolean;
}

interface UpdateSupplierData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
  contactPerson?: string;
  balance?: number;
  isActive?: boolean;
}

class SupplierService {
  async findAll(query: SupplierQuery) {
    const {
      tenantId,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.SupplierWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { purchases: true },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { purchases: true, purchaseOrders: true },
        },
      },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return supplier;
  }

  async create(data: CreateSupplierData) {
    return prisma.supplier.create({ data });
  }

  async update(id: string, tenantId: string, data: UpdateSupplierData) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    if (supplier._count.purchases > 0) {
      throw new Error('Cannot delete supplier with purchase history');
    }

    return prisma.supplier.delete({ where: { id } });
  }

  async getBalance(id: string, tenantId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, balance: true },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return supplier;
  }

  async updateBalance(id: string, tenantId: string, amount: number) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return prisma.supplier.update({
      where: { id },
      data: {
        balance: { increment: amount },
      },
    });
  }
}

export default new SupplierService();

