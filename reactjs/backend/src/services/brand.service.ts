import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateSlug, generateUniqueSlug } from '../utils/slug';
import { CreateBrandInput, UpdateBrandInput, BrandQueryInput } from '../validators/brand.validators';

export const brandService = {
  async findAll(query: BrandQueryInput) {
    const { page, limit, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.brand.count({ where }),
    ]);

    return { brands, total, page, limit };
  },

  async findById(id: number) {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) {
      throw new AppError('Brand not found', 404);
    }

    return brand;
  },

  async create(data: CreateBrandInput) {
    // Generate slug if not provided
    const slug = data.slug || await generateUniqueSlug(
      data.name,
      async (s) => !!(await prisma.brand.findUnique({ where: { slug: s } }))
    );

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        logoUrl: data.logoUrl,
        isActive: data.isActive ?? true,
      },
    });

    return brand;
  },

  async update(id: number, data: UpdateBrandInput) {
    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Brand not found', 404);
    }

    // Generate new slug if name is changed and slug not provided
    let slug = data.slug;
    if (data.name && data.name !== existing.name && !data.slug) {
      slug = await generateUniqueSlug(
        data.name,
        async (s) => {
          const found = await prisma.brand.findUnique({ where: { slug: s } });
          return found !== null && found.id !== id;
        }
      );
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        ...data,
        slug: slug || undefined,
      },
    });

    return brand;
  },

  async delete(id: number) {
    const existing = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      throw new AppError('Brand not found', 404);
    }

    if (existing._count.products > 0) {
      throw new AppError('Cannot delete brand with associated products', 400);
    }

    await prisma.brand.delete({ where: { id } });

    return { message: 'Brand deleted successfully' };
  },
};

