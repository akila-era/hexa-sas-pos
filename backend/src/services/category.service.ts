import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { z } from 'zod';

// Validation schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export class CategoryService {
  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(tenantId: string, data: z.infer<typeof categoryCreateSchema>) {
    const validated = categoryCreateSchema.parse(data);

    // Check if category name already exists for this tenant
    const existing = await (prisma as any).category.findFirst({
      where: {
        tenantId,
        name: validated.name,
      },
    });

    if (existing) {
      throw new AppErrorClass('Category with this name already exists', 409, 'CATEGORY_EXISTS');
    }

    // If parentId provided, verify it exists
    if (validated.parentId) {
      const parent = await (prisma as any).category.findFirst({
        where: {
          id: validated.parentId,
          tenantId,
        },
      });
      if (!parent) {
        throw new AppErrorClass('Parent category not found', 404, 'PARENT_NOT_FOUND');
      }
    }

    const category = await (prisma as any).category.create({
      data: {
        tenantId,
        name: validated.name,
        slug: validated.slug || this.generateSlug(validated.name),
        parentId: validated.parentId || null,
        description: validated.description || null,
        image: validated.image || null,
        isActive: validated.isActive ?? true,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return category;
  }

  async findAll(tenantId: string, filters: z.infer<typeof paginationSchema> & {
    search?: string;
    parentId?: string;
    isActive?: boolean;
  }) {
    const parsed = paginationSchema.parse(filters);
    const { page, limit, sortBy, sortOrder } = parsed;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId || null;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [categories, total] = await Promise.all([
      (prisma as any).category.findMany({
        where,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).category.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const category = await (prisma as any).category.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppErrorClass('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  async update(tenantId: string, id: string, data: z.infer<typeof categoryUpdateSchema>) {
    const validated = categoryUpdateSchema.parse(data);

    // Verify category exists
    const existing = await (prisma as any).category.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new AppErrorClass('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check for duplicate name if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await (prisma as any).category.findFirst({
        where: {
          tenantId,
          name: validated.name,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new AppErrorClass('Category with this name already exists', 409, 'CATEGORY_EXISTS');
      }
    }

    // Prevent setting parent to self or child
    if (validated.parentId) {
      if (validated.parentId === id) {
        throw new AppErrorClass('Category cannot be its own parent', 400, 'INVALID_PARENT');
      }
      const parent = await (prisma as any).category.findFirst({
        where: {
          id: validated.parentId,
          tenantId,
        },
      });
      if (!parent) {
        throw new AppErrorClass('Parent category not found', 404, 'PARENT_NOT_FOUND');
      }
    }

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    else if (validated.name) updateData.slug = this.generateSlug(validated.name);
    if (validated.parentId !== undefined) updateData.parentId = validated.parentId;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.image !== undefined) updateData.image = validated.image;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const category = await (prisma as any).category.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return category;
  }

  async delete(tenantId: string, id: string) {
    const category = await (prisma as any).category.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new AppErrorClass('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new AppErrorClass('Cannot delete category with products', 400, 'HAS_PRODUCTS');
    }

    // Check if category has children
    if (category._count.children > 0) {
      throw new AppErrorClass('Cannot delete category with subcategories', 400, 'HAS_CHILDREN');
    }

    await (prisma as any).category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  // Get category tree (hierarchical)
  async getTree(tenantId: string) {
    const categories = await (prisma as any).category.findMany({
      where: {
        tenantId,
        parentId: null, // Get only root categories
      },
      include: {
        children: {
          include: {
            children: true,
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }
}

export default new CategoryService();

