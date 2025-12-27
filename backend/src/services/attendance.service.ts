import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface AttendanceQuery {
  tenantId: string;
  branchId?: string;
  employeeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface ClockInData {
  employeeId: string;
  branchId?: string;
  note?: string;
}

interface ClockOutData {
  employeeId: string;
  note?: string;
}

class AttendanceService {
  async findAll(query: AttendanceQuery) {
    const {
      tenantId,
      branchId,
      employeeId,
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

    const where: Prisma.AttendanceWhereInput = {
      employeeId: { in: employeeIds },
      ...(branchId && { branchId }),
      ...(employeeId && { employeeId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
    };

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
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
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return { attendances, total, page, limit };
  }

  async clockIn(data: ClockInData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        date: today,
      },
    });

    if (existing && existing.clockIn) {
      throw new Error('Already clocked in today');
    }

    const now = new Date();

    // Get employee's shift to determine if late
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { shift: true },
    });

    let status = 'PRESENT';
    if (employee?.shift) {
      const [shiftHour, shiftMinute] = employee.shift.startTime.split(':').map(Number);
      const shiftStart = new Date(today);
      shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

      // Consider late if more than 15 minutes after shift start
      const gracePeriod = 15 * 60 * 1000; // 15 minutes
      if (now.getTime() > shiftStart.getTime() + gracePeriod) {
        status = 'LATE';
      }
    }

    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          clockIn: now,
          status,
          note: data.note,
        },
      });
    }

    return prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        branchId: data.branchId,
        date: today,
        clockIn: now,
        status,
        note: data.note,
      },
    });
  }

  async clockOut(data: ClockOutData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        date: today,
      },
    });

    if (!attendance) {
      throw new Error('No clock in record found for today');
    }

    if (attendance.clockOut) {
      throw new Error('Already clocked out today');
    }

    const now = new Date();
    const clockIn = new Date(attendance.clockIn!);
    
    // Calculate work hours
    const workHoursMs = now.getTime() - clockIn.getTime();
    const workHours = workHoursMs / (1000 * 60 * 60); // Convert to hours

    // Get employee's shift to calculate overtime
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { shift: true },
    });

    let overtime = 0;
    if (employee?.shift) {
      const [endHour, endMinute] = employee.shift.endTime.split(':').map(Number);
      const shiftEnd = new Date(today);
      shiftEnd.setHours(endHour, endMinute, 0, 0);

      if (now.getTime() > shiftEnd.getTime()) {
        overtime = (now.getTime() - shiftEnd.getTime()) / (1000 * 60 * 60);
      }
    }

    return prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        workHours: parseFloat(workHours.toFixed(2)),
        overtime: parseFloat(overtime.toFixed(2)),
        note: data.note || attendance.note,
      },
    });
  }

  async markAbsent(employeeId: string, date: Date, note?: string) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: { employeeId, date: dateOnly },
    });

    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: { status: 'ABSENT', note },
      });
    }

    return prisma.attendance.create({
      data: {
        employeeId,
        date: dateOnly,
        status: 'ABSENT',
        note,
      },
    });
  }

  async getEmployeeAttendance(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getTodayAttendance(tenantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(branchId && { branchId }),
      },
      include: {
        attendances: {
          where: { date: today },
          take: 1,
        },
      },
    });

    const summary = {
      total: employees.length,
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
      notMarked: 0,
    };

    employees.forEach(emp => {
      const attendance = emp.attendances[0];
      if (!attendance) {
        summary.notMarked++;
      } else {
        switch (attendance.status) {
          case 'PRESENT':
            summary.present++;
            break;
          case 'ABSENT':
            summary.absent++;
            break;
          case 'LATE':
            summary.late++;
            break;
          case 'ON_LEAVE':
            summary.onLeave++;
            break;
          default:
            summary.notMarked++;
        }
      }
    });

    return { summary, employees };
  }
}

export default new AttendanceService();

