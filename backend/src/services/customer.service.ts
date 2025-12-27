import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface CustomerQuery {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateCustomerData {
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
  creditLimit?: number;
  isActive?: boolean;
}

interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
  creditLimit?: number;
  balance?: number;
  isActive?: boolean;
}

class CustomerService {
  async findAll(query: CustomerQuery) {
    const {
      tenantId,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { sales: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { sales: true, quotations: true, invoices: true },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async create(data: CreateCustomerData) {
    return prisma.customer.create({ data });
  }

  async update(id: string, tenantId: string, data: UpdateCustomerData) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer._count.sales > 0) {
      throw new Error('Cannot delete customer with sales history');
    }

    return prisma.customer.delete({ where: { id } });
  }

  async getBalance(id: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true, balance: true, creditLimit: true },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async updateBalance(id: string, tenantId: string, amount: number) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return prisma.customer.update({
      where: { id },
      data: {
        balance: { increment: amount },
      },
    });
  }

  async getSalesHistory(id: string, tenantId: string, page = 1, limit = 10) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.sale.count({ where: { customerId: id } }),
    ]);

    return { sales, total, page, limit };
  }
}

export default new CustomerService();

