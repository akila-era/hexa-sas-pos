import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface LeaveQuery {
  tenantId: string;
  employeeId?: string;
  leaveTypeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface CreateLeaveData {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

class LeaveService {
  async findAll(query: LeaveQuery) {
    const {
      tenantId,
      employeeId,
      leaveTypeId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    // Get employee IDs for the tenant
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      select: { id: true },
    });
    const employeeIds = employees.map(e => e.id);

    const where: Prisma.LeaveWhereInput = {
      employeeId: { in: employeeIds },
      ...(employeeId && { employeeId }),
      ...(leaveTypeId && { leaveTypeId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
        ],
      }),
    };

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
          leaveType: true,
        },
      }),
      prisma.leave.count({ where }),
    ]);

    return { leaves, total, page, limit };
  }

  async findById(id: string) {
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    return leave;
  }

  async create(data: CreateLeaveData) {
    // Calculate days
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leaves
    const overlapping = await prisma.leave.findFirst({
      where: {
        employeeId: data.employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error('Leave request overlaps with an existing leave');
    }

    // Check leave balance
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: data.leaveTypeId },
    });

    if (!leaveType) {
      throw new Error('Leave type not found');
    }

    // Get used leaves for this type in current year
    const year = new Date().getFullYear();
    const usedLeaves = await prisma.leave.aggregate({
      where: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        status: 'APPROVED',
        startDate: { gte: new Date(year, 0, 1) },
      },
      _sum: { days: true },
    });

    const usedDays = usedLeaves._sum.days || 0;
    if (leaveType.daysAllowed > 0 && usedDays + days > leaveType.daysAllowed) {
      throw new Error(`Insufficient leave balance. Available: ${leaveType.daysAllowed - usedDays} days`);
    }

    return prisma.leave.create({
      data: {
        ...data,
        days,
      },
      include: {
        leaveType: true,
      },
    });
  }

  async approve(id: string, approvedBy: string) {
    const leave = await prisma.leave.findUnique({ where: { id } });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw new Error('Leave request is not pending');
    }

    return prisma.$transaction(async (tx) => {
      const updatedLeave = await tx.leave.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
        },
      });

      // Mark attendance as ON_LEAVE for the leave period
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateOnly = new Date(d);
        dateOnly.setHours(0, 0, 0, 0);
        
        await tx.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: leave.employeeId,
              date: dateOnly,
            },
          },
          create: {
            employeeId: leave.employeeId,
            date: dateOnly,
            status: 'ON_LEAVE',
          },
          update: {
            status: 'ON_LEAVE',
          },
        });
      }

      return updatedLeave;
    });
  }

  async reject(id: string, rejectedBy: string, reason?: string) {
    const leave = await prisma.leave.findUnique({ where: { id } });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw new Error('Leave request is not pending');
    }

    return prisma.leave.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectReason: reason,
      },
    });
  }

  async cancel(id: string) {
    const leave = await prisma.leave.findUnique({ where: { id } });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (!['PENDING', 'APPROVED'].includes(leave.status)) {
      throw new Error('Cannot cancel this leave request');
    }

    return prisma.leave.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getLeaveBalance(employeeId: string, tenantId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where: { tenantId, isActive: true },
    });

    const year = new Date().getFullYear();
    const balances = await Promise.all(
      leaveTypes.map(async (type) => {
        const used = await prisma.leave.aggregate({
          where: {
            employeeId,
            leaveTypeId: type.id,
            status: 'APPROVED',
            startDate: { gte: new Date(year, 0, 1) },
          },
          _sum: { days: true },
        });

        return {
          leaveType: type,
          allowed: type.daysAllowed,
          used: used._sum.days || 0,
          available: type.daysAllowed - (used._sum.days || 0),
        };
      })
    );

    return balances;
  }
}

export default new LeaveService();

