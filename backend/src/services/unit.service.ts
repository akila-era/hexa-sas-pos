import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface UnitQuery {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateUnitData {
  tenantId: string;
  name: string;
  shortName: string;
  baseUnit?: string;
  operator?: string;
  operatorValue?: number;
  isActive?: boolean;
}

interface UpdateUnitData {
  name?: string;
  shortName?: string;
  baseUnit?: string;
  operator?: string;
  operatorValue?: number;
  isActive?: boolean;
}

class UnitService {
  async findAll(query: UnitQuery) {
    const {
      tenantId,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.UnitWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    };

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
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
      prisma.unit.count({ where }),
    ]);

    return { units, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const unit = await prisma.unit.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    return unit;
  }

  async create(data: CreateUnitData) {
    const existing = await prisma.unit.findFirst({
      where: { tenantId: data.tenantId, name: data.name },
    });

    if (existing) {
      throw new Error('Unit with this name already exists');
    }

    return prisma.unit.create({ data });
  }

  async update(id: string, tenantId: string, data: UpdateUnitData) {
    const unit = await prisma.unit.findFirst({
      where: { id, tenantId },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    if (data.name && data.name !== unit.name) {
      const existing = await prisma.unit.findFirst({
        where: { tenantId, name: data.name, id: { not: id } },
      });

      if (existing) {
        throw new Error('Unit with this name already exists');
      }
    }

    return prisma.unit.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const unit = await prisma.unit.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    if (unit._count.products > 0) {
      throw new Error('Cannot delete unit with associated products');
    }

    return prisma.unit.delete({ where: { id } });
  }
}

export default new UnitService();

