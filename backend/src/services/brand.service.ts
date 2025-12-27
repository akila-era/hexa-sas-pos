import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface BrandQuery {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateBrandData {
  tenantId: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

interface UpdateBrandData {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

class BrandService {
  async findAll(query: BrandQuery) {
    const {
      tenantId,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.BrandWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.brand.count({ where }),
    ]);

    return { brands, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const brand = await prisma.brand.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new Error('Brand not found');
    }

    return brand;
  }

  async create(data: CreateBrandData) {
    const existing = await prisma.brand.findFirst({
      where: { tenantId: data.tenantId, name: data.name },
    });

    if (existing) {
      throw new Error('Brand with this name already exists');
    }

    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');

    return prisma.brand.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  async update(id: string, tenantId: string, data: UpdateBrandData) {
    const brand = await prisma.brand.findFirst({
      where: { id, tenantId },
    });

    if (!brand) {
      throw new Error('Brand not found');
    }

    if (data.name && data.name !== brand.name) {
      const existing = await prisma.brand.findFirst({
        where: { tenantId, name: data.name, id: { not: id } },
      });

      if (existing) {
        throw new Error('Brand with this name already exists');
      }
    }

    const slug = data.name 
      ? data.name.toLowerCase().replace(/\s+/g, '-') 
      : undefined;

    return prisma.brand.update({
      where: { id },
      data: {
        ...data,
        ...(slug && { slug }),
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const brand = await prisma.brand.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      throw new Error('Brand not found');
    }

    if (brand._count.products > 0) {
      throw new Error('Cannot delete brand with associated products');
    }

    return prisma.brand.delete({ where: { id } });
  }
}

export default new BrandService();

