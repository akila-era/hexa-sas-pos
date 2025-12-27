import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface DepartmentQuery {
  tenantId: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateDepartmentData {
  tenantId: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

interface UpdateDepartmentData {
  name?: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

class DepartmentService {
  async findAll(query: DepartmentQuery) {
    const { tenantId, isActive, search, page = 1, limit = 10 } = query;

    const where: Prisma.DepartmentWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { employees: true, designations: true } },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return { departments, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const department = await prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        designations: true,
        _count: { select: { employees: true } },
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    return department;
  }

  async create(data: CreateDepartmentData) {
    const existing = await prisma.department.findFirst({
      where: { tenantId: data.tenantId, name: data.name },
    });

    if (existing) {
      throw new Error('Department with this name already exists');
    }

    return prisma.department.create({ data });
  }

  async update(id: string, tenantId: string, data: UpdateDepartmentData) {
    const department = await prisma.department.findFirst({
      where: { id, tenantId },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    if (data.name && data.name !== department.name) {
      const existing = await prisma.department.findFirst({
        where: { tenantId, name: data.name, id: { not: id } },
      });

      if (existing) {
        throw new Error('Department with this name already exists');
      }
    }

    return prisma.department.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const department = await prisma.department.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { employees: true } } },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    if (department._count.employees > 0) {
      throw new Error('Cannot delete department with employees');
    }

    return prisma.department.delete({ where: { id } });
  }
}

export default new DepartmentService();

