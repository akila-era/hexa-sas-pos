import { prisma } from '../../database/client';
import { AppError } from '../../middlewares/error.middleware';
import { hashPassword } from '../../utils/auth.utils';
import {
  SuperAdminUserCreate,
  SuperAdminUserUpdate,
  SuperAdminUserFilter,
} from '../../utils/superadmin.validation';

export class SuperAdminUsersService {
  /**
   * Create a new super admin user
   */
  async create(data: SuperAdminUserCreate) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }

    // Find or create system tenant for super admins
    let systemTenant = await prisma.tenant.findFirst({
      where: { name: 'System' },
    });

    if (!systemTenant) {
      systemTenant = await prisma.tenant.create({
        data: {
          name: 'System',
          plan: 'SYSTEM',
          isActive: true,
        },
      });
    }

    // Find or create system branch
    let systemBranch = await prisma.branch.findFirst({
      where: {
        tenantId: systemTenant.id,
        name: 'System Branch',
      },
    });

    if (!systemBranch) {
      systemBranch = await prisma.branch.create({
        data: {
          tenantId: systemTenant.id,
          name: 'System Branch',
          isActive: true,
        },
      });
    }

    // Find or create super admin role
    let superAdminRole = await prisma.role.findFirst({
      where: {
        tenantId: systemTenant.id,
        name: { contains: 'super admin', mode: 'insensitive' },
      },
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          tenantId: systemTenant.id,
          name: 'Super Admin',
        },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create super admin user
    const user = await prisma.user.create({
      data: {
        tenantId: systemTenant.id,
        branchId: systemBranch.id,
        roleId: superAdminRole.id,
        email: data.email,
        password: hashedPassword,
        isActive: data.isActive ?? true,
      },
      include: {
        role: true,
        tenant: true,
        branch: true,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all super admin users with filters and pagination
   */
  async findAll(filters: SuperAdminUserFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Find system tenant
    const systemTenant = await prisma.tenant.findFirst({
      where: { name: 'System' },
    });

    if (!systemTenant) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Find super admin role
    const superAdminRole = await prisma.role.findFirst({
      where: {
        tenantId: systemTenant.id,
        name: { contains: 'super admin', mode: 'insensitive' },
      },
    });

    const where: any = {
      tenantId: systemTenant.id,
    };

    if (superAdminRole) {
      where.roleId = superAdminRole.id;
    }

    if (filters.status && filters.status !== 'all') {
      where.isActive = filters.status === 'active';
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          role: true,
          tenant: true,
          branch: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const formattedUsers = users.map((u) => {
      const { password: _, ...userWithoutPassword } = u;
      return {
        ...userWithoutPassword,
        firstName: (u as any).firstName || '',
        lastName: (u as any).lastName || '',
      };
    });

    return {
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single super admin user by ID
   */
  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        tenant: true,
        branch: true,
      },
    });

    if (!user) {
      throw new AppError('Super admin user not found', 404, 'USER_NOT_FOUND');
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      firstName: (user as any).firstName || '',
      lastName: (user as any).lastName || '',
    };
  }

  /**
   * Update a super admin user
   */
  async update(id: string, data: SuperAdminUserUpdate) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Super admin user not found', 404, 'USER_NOT_FOUND');
    }

    // Check email uniqueness if updating
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
      }
    }

    const updateData: any = {};

    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        tenant: true,
        branch: true,
      },
    });

    const { password: _, ...userWithoutPassword } = updated;
    return {
      ...userWithoutPassword,
      firstName: (updated as any).firstName || '',
      lastName: (updated as any).lastName || '',
    };
  }

  /**
   * Delete a super admin user
   */
  async delete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Super admin user not found', 404, 'USER_NOT_FOUND');
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Super admin user deactivated successfully' };
  }

  /**
   * Toggle user status
   */
  async toggleStatus(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Super admin user not found', 404, 'USER_NOT_FOUND');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: {
        role: true,
        tenant: true,
        branch: true,
      },
    });

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}

export default new SuperAdminUsersService();





