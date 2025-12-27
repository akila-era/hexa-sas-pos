import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface LeaveTypeQuery {
  tenantId: string;
  isActive?: boolean;
  isPaid?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateLeaveTypeData {
  tenantId: string;
  name: string;
  daysAllowed: number;
  isPaid?: boolean;
  isActive?: boolean;
}

interface UpdateLeaveTypeData {
  name?: string;
  daysAllowed?: number;
  isPaid?: boolean;
  isActive?: boolean;
}

class LeaveTypeService {
  async findAll(query: LeaveTypeQuery) {
    const { tenantId, isActive, isPaid, search, page = 1, limit = 10 } = query;

    const where: Prisma.LeaveTypeWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(isPaid !== undefined && { isPaid }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [leaveTypes, total] = await Promise.all([
      prisma.leaveType.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { leaves: true } },
        },
      }),
      prisma.leaveType.count({ where }),
    ]);

    return {
      leaveTypes,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, tenantId: string) {
    const leaveType = await prisma.leaveType.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { leaves: true } },
      },
    });

    if (!leaveType) {
      throw new Error('Leave type not found');
    }

    return leaveType;
  }

  async create(data: CreateLeaveTypeData) {
    // Check if leave type with same name exists for tenant
    const existing = await prisma.leaveType.findFirst({
      where: {
        tenantId: data.tenantId,
        name: data.name,
      },
    });

    if (existing) {
      throw new Error('Leave type with this name already exists');
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        daysAllowed: data.daysAllowed,
        isPaid: data.isPaid ?? true,
        isActive: data.isActive ?? true,
      },
      include: {
        _count: { select: { leaves: true } },
      },
    });

    return leaveType;
  }

  async update(id: string, tenantId: string, data: UpdateLeaveTypeData) {
    const leaveType = await prisma.leaveType.findFirst({
      where: { id, tenantId },
    });

    if (!leaveType) {
      throw new Error('Leave type not found');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== leaveType.name) {
      const existing = await prisma.leaveType.findFirst({
        where: {
          tenantId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Leave type with this name already exists');
      }
    }

    const updated = await prisma.leaveType.update({
      where: { id },
      data,
      include: {
        _count: { select: { leaves: true } },
      },
    });

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const leaveType = await prisma.leaveType.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { leaves: true } },
      },
    });

    if (!leaveType) {
      throw new Error('Leave type not found');
    }

    // Check if leave type has leaves
    if (leaveType._count.leaves > 0) {
      throw new Error('Cannot delete leave type with associated leaves');
    }

    await prisma.leaveType.delete({
      where: { id },
    });
  }
}

export default new LeaveTypeService();

