import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateSlug, generateUniqueSlug } from '../utils/slug';
import { CreateCategoryInput, UpdateCategoryInput, CategoryQueryInput } from '../validators/category.validators';

export const categoryService = {
  async findAll(query: CategoryQueryInput) {
    const { page, limit, search, parentId, isActive, includeChildren } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeChildren
          ? {
              children: {
                where: { isActive: true },
                select: { id: true, name: true, slug: true },
              },
              parent: {
                select: { id: true, name: true, slug: true },
              },
            }
          : {
              parent: {
                select: { id: true, name: true, slug: true },
              },
            },
      }),
      prisma.category.count({ where }),
    ]);

    return { categories, total, page, limit };
  },

  async findById(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, imageUrl: true },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  },

  async create(data: CreateCategoryInput) {
    // Generate slug if not provided
    const slug = data.slug || await generateUniqueSlug(
      data.name,
      async (s) => !!(await prisma.category.findUnique({ where: { slug: s } }))
    );

    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });

    return category;
  },

  async update(id: number, data: UpdateCategoryInput) {
    // Check if category exists
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    // Generate new slug if name is changed and slug not provided
    let slug = data.slug;
    if (data.name && data.name !== existing.name && !data.slug) {
      slug = await generateUniqueSlug(
        data.name,
        async (s) => {
          const found = await prisma.category.findUnique({ where: { slug: s } });
          return found !== null && found.id !== id;
        }
      );
    }

    // Validate parent if changing
    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        throw new AppError('Category cannot be its own parent', 400);
      }
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        slug: slug || undefined,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });

    return category;
  },

  async delete(id: number) {
    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    // Check if category has products
    if (existing._count.products > 0) {
      throw new AppError('Cannot delete category with associated products', 400);
    }

    // Check if category has children
    if (existing._count.children > 0) {
      throw new AppError('Cannot delete category with subcategories', 400);
    }

    await prisma.category.delete({ where: { id } });

    return { message: 'Category deleted successfully' };
  },
};

