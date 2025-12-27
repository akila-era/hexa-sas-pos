import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface EmployeeQuery {
  tenantId: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  employmentType?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateEmployeeData {
  tenantId: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  shiftId?: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  joinDate?: Date;
  employmentType?: string;
  salary?: number;
  salaryType?: string;
  bankName?: string;
  bankAccount?: string;
  taxNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  avatar?: string;
  isActive?: boolean;
}

interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  endDate?: Date;
}

class EmployeeService {
  async findAll(query: EmployeeQuery) {
    const {
      tenantId,
      branchId,
      departmentId,
      designationId,
      employmentType,
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      ...(branchId && { branchId }),
      ...(departmentId && { departmentId }),
      ...(designationId && { designationId }),
      ...(employmentType && { employmentType }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        branch: true,
        department: true,
        designation: true,
        shift: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  }

  async create(data: CreateEmployeeData) {
    // Generate employee ID if not provided
    if (!data.employeeId) {
      const count = await prisma.employee.count({
        where: { tenantId: data.tenantId },
      });
      data.employeeId = `EMP-${String(count + 1).padStart(5, '0')}`;
    }

    return prisma.employee.create({
      data,
      include: {
        department: true,
        designation: true,
      },
    });
  }

  async update(id: string, tenantId: string, data: UpdateEmployeeData) {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return prisma.employee.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return prisma.employee.delete({ where: { id } });
  }

  async getAttendanceSummary(id: string, tenantId: string, month: number, year: number) {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: id,
        date: { gte: startDate, lte: endDate },
      },
    });

    const summary = {
      totalDays: endDate.getDate(),
      present: attendances.filter(a => a.status === 'PRESENT').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late: attendances.filter(a => a.status === 'LATE').length,
      halfDay: attendances.filter(a => a.status === 'HALF_DAY').length,
      onLeave: attendances.filter(a => a.status === 'ON_LEAVE').length,
      totalHours: attendances.reduce((sum, a) => sum + Number(a.workHours || 0), 0),
      overtime: attendances.reduce((sum, a) => sum + Number(a.overtime || 0), 0),
    };

    return summary;
  }
}

export default new EmployeeService();

