import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateUnitInput, UpdateUnitInput, UnitQueryInput } from '../validators/unit.validators';

export const unitService = {
  async findAll(query: UnitQueryInput) {
    const { page, limit, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.unit.count({ where }),
    ]);

    return { units, total, page, limit };
  },

  async findById(id: number) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!unit) {
      throw new AppError('Unit not found', 404);
    }

    return unit;
  },

  async create(data: CreateUnitInput) {
    const unit = await prisma.unit.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        isActive: data.isActive ?? true,
      },
    });

    return unit;
  },

  async update(id: number, data: UpdateUnitInput) {
    const existing = await prisma.unit.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Unit not found', 404);
    }

    const unit = await prisma.unit.update({
      where: { id },
      data,
    });

    return unit;
  },

  async delete(id: number) {
    const existing = await prisma.unit.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      throw new AppError('Unit not found', 404);
    }

    if (existing._count.products > 0) {
      throw new AppError('Cannot delete unit with associated products', 400);
    }

    await prisma.unit.delete({ where: { id } });

    return { message: 'Unit deleted successfully' };
  },
};

