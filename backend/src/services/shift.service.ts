import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface ShiftQuery {
  tenantId: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateShiftData {
  tenantId: string;
  name: string;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breakStart?: string;
  breakEnd?: string;
  workDays: string[]; // ["MON", "TUE", "WED", "THU", "FRI"]
  isActive?: boolean;
}

interface UpdateShiftData {
  name?: string;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  workDays?: string[];
  isActive?: boolean;
}

class ShiftService {
  async findAll(query: ShiftQuery) {
    const { tenantId, isActive, search, page = 1, limit = 10 } = query;

    const where: Prisma.ShiftWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { employees: true } },
        },
      }),
      prisma.shift.count({ where }),
    ]);

    return {
      shifts,
      total,
      page,
      limit,
    };
  }

  async findById(id: string, tenantId: string) {
    const shift = await prisma.shift.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { employees: true } },
      },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    return shift;
  }

  async create(data: CreateShiftData) {
    // Check if shift with same name exists for tenant
    const existing = await prisma.shift.findFirst({
      where: {
        tenantId: data.tenantId,
        name: data.name,
      },
    });

    if (existing) {
      throw new Error('Shift with this name already exists');
    }

    const shift = await prisma.shift.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
        workDays: data.workDays,
        isActive: data.isActive ?? true,
      },
      include: {
        _count: { select: { employees: true } },
      },
    });

    return shift;
  }

  async update(id: string, tenantId: string, data: UpdateShiftData) {
    const shift = await prisma.shift.findFirst({
      where: { id, tenantId },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== shift.name) {
      const existing = await prisma.shift.findFirst({
        where: {
          tenantId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('Shift with this name already exists');
      }
    }

    const updated = await prisma.shift.update({
      where: { id },
      data,
      include: {
        _count: { select: { employees: true } },
      },
    });

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const shift = await prisma.shift.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { employees: true } },
      },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    // Check if shift has employees
    if (shift._count.employees > 0) {
      throw new Error('Cannot delete shift with assigned employees');
    }

    await prisma.shift.delete({
      where: { id },
    });
  }
}

export default new ShiftService();

