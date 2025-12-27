import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface PayrollQuery {
  tenantId: string;
  employeeId?: string;
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  limit?: number;
}

interface GeneratePayrollData {
  tenantId: string;
  month: number;
  year: number;
  employeeIds?: string[];
}

interface ProcessPayrollData {
  bonus?: number;
  allowances?: number;
  deductions?: number;
  note?: string;
}

class PayrollService {
  async findAll(query: PayrollQuery) {
    const {
      tenantId,
      employeeId,
      month,
      year,
      status,
      page = 1,
      limit = 10,
    } = query;

    // Get employee IDs for the tenant
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      select: { id: true },
    });
    const employeeIds = employees.map(e => e.id);

    const where: Prisma.PayrollWhereInput = {
      employeeId: { in: employeeIds },
      ...(employeeId && { employeeId }),
      ...(month && { month }),
      ...(year && { year }),
      ...(status && { status }),
    };

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              salary: true,
              salaryType: true,
            },
          },
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return { payrolls, total, page, limit };
  }

  async findById(id: string) {
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    return payroll;
  }

  async generate(data: GeneratePayrollData) {
    const { tenantId, month, year, employeeIds } = data;

    // Get employees
    const whereEmployee: Prisma.EmployeeWhereInput = {
      tenantId,
      isActive: true,
      ...(employeeIds && { id: { in: employeeIds } }),
    };

    const employees = await prisma.employee.findMany({
      where: whereEmployee,
      include: { shift: true },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDaysInMonth = endDate.getDate();

    const payrolls = await Promise.all(
      employees.map(async (employee) => {
        // Check if payroll already exists
        const existing = await prisma.payroll.findFirst({
          where: { employeeId: employee.id, month, year },
        });

        if (existing) {
          return existing;
        }

        // Get attendance summary
        const attendances = await prisma.attendance.findMany({
          where: {
            employeeId: employee.id,
            date: { gte: startDate, lte: endDate },
          },
        });

        const presentDays = attendances.filter(a => 
          ['PRESENT', 'LATE'].includes(a.status)
        ).length;
        const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
        const leaveDays = attendances.filter(a => a.status === 'ON_LEAVE').length;
        const totalOvertime = attendances.reduce(
          (sum, a) => sum + Number(a.overtime || 0), 0
        );

        // Calculate salary
        const baseSalary = Number(employee.salary) || 0;
        let basicSalary = baseSalary;

        // Deduct for absent days (if applicable)
        if (employee.salaryType === 'MONTHLY' && absentDays > 0) {
          const dailyRate = baseSalary / totalDaysInMonth;
          basicSalary = baseSalary - (dailyRate * absentDays);
        } else if (employee.salaryType === 'DAILY') {
          basicSalary = baseSalary * presentDays;
        }

        // Calculate overtime pay (1.5x hourly rate)
        const hourlyRate = baseSalary / (totalDaysInMonth * 8); // Assuming 8 hours/day
        const overtimePay = totalOvertime * hourlyRate * 1.5;

        // Calculate net salary (before additional adjustments)
        const netSalary = basicSalary + overtimePay;

        return prisma.payroll.create({
          data: {
            employeeId: employee.id,
            month,
            year,
            basicSalary,
            overtime: overtimePay,
            netSalary,
            workDays: totalDaysInMonth,
            presentDays,
            absentDays,
            leaveDays,
          },
        });
      })
    );

    return payrolls;
  }

  async process(id: string, data: ProcessPayrollData) {
    const payroll = await prisma.payroll.findUnique({ where: { id } });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    if (payroll.status !== 'DRAFT') {
      throw new Error('Payroll already processed');
    }

    const bonus = data.bonus || 0;
    const allowances = data.allowances || 0;
    const deductions = data.deductions || 0;
    const tax = data.deductions || 0; // Simplified tax calculation

    const netSalary = 
      Number(payroll.basicSalary) +
      Number(payroll.overtime) +
      bonus +
      allowances -
      deductions -
      tax;

    return prisma.payroll.update({
      where: { id },
      data: {
        bonus,
        allowances,
        deductions,
        tax,
        netSalary,
        status: 'PROCESSED',
        note: data.note,
      },
    });
  }

  async markAsPaid(id: string, paymentMethod?: string) {
    const payroll = await prisma.payroll.findUnique({ where: { id } });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    if (payroll.status !== 'PROCESSED') {
      throw new Error('Payroll must be processed before payment');
    }

    return prisma.payroll.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod,
      },
    });
  }

  async bulkMarkAsPaid(ids: string[], paymentMethod?: string) {
    return prisma.payroll.updateMany({
      where: {
        id: { in: ids },
        status: 'PROCESSED',
      },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod,
      },
    });
  }

  async getPayrollSummary(tenantId: string, month: number, year: number) {
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      select: { id: true },
    });
    const employeeIds = employees.map(e => e.id);

    const payrolls = await prisma.payroll.findMany({
      where: {
        employeeId: { in: employeeIds },
        month,
        year,
      },
    });

    const summary = {
      totalEmployees: payrolls.length,
      totalBasicSalary: payrolls.reduce((sum, p) => sum + Number(p.basicSalary), 0),
      totalOvertime: payrolls.reduce((sum, p) => sum + Number(p.overtime), 0),
      totalBonus: payrolls.reduce((sum, p) => sum + Number(p.bonus), 0),
      totalAllowances: payrolls.reduce((sum, p) => sum + Number(p.allowances), 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + Number(p.deductions), 0),
      totalTax: payrolls.reduce((sum, p) => sum + Number(p.tax), 0),
      totalNetSalary: payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0),
      draft: payrolls.filter(p => p.status === 'DRAFT').length,
      processed: payrolls.filter(p => p.status === 'PROCESSED').length,
      paid: payrolls.filter(p => p.status === 'PAID').length,
    };

    return summary;
  }
}

export default new PayrollService();

