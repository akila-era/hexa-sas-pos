import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface DesignationQuery {
  tenantId: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateDesignationData {
  tenantId: string;
  departmentId?: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateDesignationData {
  departmentId?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

class DesignationService {
  async findAll(query: DesignationQuery) {
    const { tenantId, departmentId, isActive, search, page = 1, limit = 10 } = query;

    const where: Prisma.DesignationWhereInput = {
      tenantId,
      ...(departmentId && { departmentId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [designations, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: { select: { employees: true } },
        },
      }),
      prisma.designation.count({ where }),
    ]);

    return {
      designations,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, tenantId: string) {
    const designation = await prisma.designation.findFirst({
      where: { id, tenantId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { select: { employees: true } },
      },
    });

    if (!designation) {
      throw new Error('Designation not found');
    }

    return designation;
  }

  async create(data: CreateDesignationData) {
    // Check if designation with same name exists for tenant
    const existing = await prisma.designation.findFirst({
      where: {
        tenantId: data.tenantId,
        name: data.name,
      },
    });

    if (existing) {
      throw new Error('Designation with this name already exists');
    }

    // If departmentId is provided, verify it exists
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId,
          tenantId: data.tenantId,
        },
      });

      if (!department) {
        throw new Error('Department not found');
      }
    }

    const designation = await prisma.designation.create({
      data: {
        tenantId: data.tenantId,
        departmentId: data.departmentId,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { select: { employees: true } },
      },
    });

    return designation;
  }

  async update(id: string, tenantId: string, data: UpdateDesignationData) {
    const designation = await prisma.designation.findFirst({
      where: { id, tenantId },
    });

    if (!designation) {
      throw new Error('Designation not found');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== designation.name) {
      const existing = await prisma.designation.findFirst({
        where: {
          tenantId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Designation with this name already exists');
      }
    }

    // If departmentId is provided, verify it exists
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId,
          tenantId,
        },
      });

      if (!department) {
        throw new Error('Department not found');
      }
    }

    const updated = await prisma.designation.update({
      where: { id },
      data,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { select: { employees: true } },
      },
    });

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const designation = await prisma.designation.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { employees: true } },
      },
    });

    if (!designation) {
      throw new Error('Designation not found');
    }

    // Check if designation has employees
    if (designation._count.employees > 0) {
      throw new Error('Cannot delete designation with assigned employees');
    }

    await prisma.designation.delete({
      where: { id },
    });
  }
}

export default new DesignationService();

