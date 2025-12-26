import { prisma } from '../database/client';
import { AppError } from '../types';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { branchCreateSchema, branchUpdateSchema } from '../utils/validation';
import { z } from 'zod';

export class BranchService {
  async create(companyId: string, data: z.infer<typeof branchCreateSchema>) {
    const validated = branchCreateSchema.parse(data);

    // Check if code already exists for this company
    // @ts-ignore - Prisma client type mismatch
    const existing = await (prisma as any).branch.findFirst({
      where: {
        tenantId: companyId,
        code: validated.code,
      },
    });

    if (existing) {
      throw new AppErrorClass('Branch code already exists', 409, 'BRANCH_CODE_EXISTS');
    }

    // Validate manager if provided
    if (validated.managerId) {
      // @ts-ignore - Prisma client type mismatch
      const manager = await (prisma.user.findFirst as any)({
        where: {
          id: validated.managerId,
          // @ts-ignore
          tenantId: companyId,
        },
      });

      if (!manager) {
        throw new AppErrorClass('Manager not found', 404, 'MANAGER_NOT_FOUND');
      }
    }

    // @ts-ignore - Prisma client type mismatch
    const branch = await (prisma as any).branch.create({
      data: {
        ...validated,
        tenantId: companyId,
      },
      include: {
        tenant: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return branch;
  }

  async findAll(companyId: string, filters: { isActive?: boolean }) {
    const where: any = {
      tenantId: companyId,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // @ts-ignore - Prisma client type mismatch
    const branches = await (prisma as any).branch.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            warehouses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return branches;
  }

  async findOne(companyId: string, id: string) {
    // @ts-ignore - Prisma client type mismatch
    const branch = await (prisma as any).branch.findFirst({
      where: {
        id,
        tenantId: companyId,
      },
      include: {
        tenant: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        warehouses: true,
      },
    });

    if (!branch) {
      throw new AppErrorClass('Branch not found', 404, 'BRANCH_NOT_FOUND');
    }

    return branch;
  }

  async update(companyId: string, id: string, data: z.infer<typeof branchUpdateSchema>) {
    const validated = branchUpdateSchema.parse(data);

    // @ts-ignore - Prisma client type mismatch
    const branch = await (prisma as any).branch.findFirst({
      where: {
        id,
        tenantId: companyId,
      },
    });

    if (!branch) {
      throw new AppErrorClass('Branch not found', 404, 'BRANCH_NOT_FOUND');
    }

    // Validate manager if provided
    if (validated.managerId) {
      // @ts-ignore - Prisma client needs regeneration
      const manager = await (prisma as any).user.findFirst({
        where: {
          id: validated.managerId,
          tenantId: companyId,
        },
      });

      if (!manager) {
        throw new AppErrorClass('Manager not found', 404, 'MANAGER_NOT_FOUND');
      }
    }

    // @ts-ignore - Prisma client type mismatch
    const updated = await (prisma as any).branch.update({
      where: { id },
      data: validated,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }
}

export default new BranchService();

