import { prisma } from '../database/client';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, generateRandomToken, generateOTP } from '../utils/auth.utils';
import { userRegisterSchema, userLoginSchema, superAdminRegisterSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, verifyOtpSchema } from '../utils/validation';
import { AppError } from '../types';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { z } from 'zod';

export class AuthService {
  async register(data: z.infer<typeof userRegisterSchema>) {
    // Validate input
    const validated = userRegisterSchema.parse(data);

    // Check if tenant exists
    // @ts-ignore - Prisma client needs regeneration
    const tenant = await (prisma as any).tenant.findUnique({
      where: { id: validated.companyId },
    });

    if (!tenant) {
      throw new AppErrorClass('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    if (!tenant.isActive) {
      throw new AppErrorClass('Tenant is not active', 403, 'TENANT_INACTIVE');
    }

    // Check if email already exists for this tenant
    // @ts-ignore - Prisma client needs regeneration
    const existingUser = await (prisma as any).user.findFirst({
      where: {
        tenantId: validated.companyId,
        email: validated.email,
      },
    });

    if (existingUser) {
      throw new AppErrorClass(
        'Email already exists for this company',
        409,
        'EMAIL_EXISTS'
      );
    }


    // Get or create default branch if not provided
    let branchId = validated.branchId;
    if (!branchId) {
      // @ts-ignore - Prisma client needs regeneration
      let defaultBranch = await (prisma as any).branch.findFirst({
        where: {
          tenantId: validated.companyId,
          name: 'Main Branch', // Try to find a branch named "Main Branch"
        },
      });

      if (!defaultBranch) {
        // Create default branch if none exists
        // @ts-ignore - Prisma client needs regeneration
        defaultBranch = await (prisma as any).branch.create({
          data: {
            tenantId: validated.companyId,
            name: 'Main Branch',
            isActive: true,
          },
        });
      }
      branchId = defaultBranch.id;
    } else {
      // Validate provided branch
      // @ts-ignore - Prisma client needs regeneration
      const branch = await (prisma as any).branch.findFirst({
        where: {
          id: validated.branchId,
          tenantId: validated.companyId,
        },
      });

      if (!branch) {
        throw new AppErrorClass(
          'Branch not found for this tenant',
          404,
          'BRANCH_NOT_FOUND'
        );
      }
    }

    // Get or create default role if not provided
    let roleId = validated.roleId;
    if (!roleId) {
      // @ts-ignore - Prisma client needs regeneration
      let defaultRole = await (prisma as any).role.findFirst({
        where: {
          tenantId: validated.companyId,
          name: 'User', // Try to find a role named "User"
        },
      });

      if (!defaultRole) {
        // Create default role if none exists
        // @ts-ignore - Prisma client needs regeneration
        defaultRole = await (prisma as any).role.create({
          data: {
            tenantId: validated.companyId,
            name: 'User',
          },
        });
      }
      roleId = defaultRole.id;
    } else {
      // Validate provided role
      // @ts-ignore - Prisma client needs regeneration
      const role = await (prisma as any).role.findFirst({
        where: {
          id: validated.roleId,
          tenantId: validated.companyId,
        },
      });

      if (!role) {
        throw new AppErrorClass(
          'Role not found for this tenant',
          404,
          'ROLE_NOT_FOUND'
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24); // Token expires in 24 hours

    // Create user
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.create({
      data: {
        email: validated.email,
        password: passwordHash,
        tenantId: validated.companyId,
        branchId: branchId, // Use resolved branchId
        roleId: roleId, // Use resolved roleId
        emailVerificationToken,
        emailVerificationExpires,
        emailVerified: false,
      },
      include: {
        tenant: true,
        branch: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      companyId: user.tenantId,
      branchId: user.branchId || undefined,
      email: user.email,
      roleId: user.roleId || undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Note: UserSession model not in schema yet, so we skip session creation
    // Tokens are still generated and returned to the client
    // TODO: Add UserSession model to schema if session tracking is needed
    // For now, tokens are stateless and validated via JWT signature

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(data: z.infer<typeof userLoginSchema>) {
    // Validate input
    const validated = userLoginSchema.parse(data);

    // Find user by email
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.findFirst({
      where: {
        email: validated.email,
      },
      include: {
        tenant: true,
        branch: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppErrorClass('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await comparePassword(
      validated.password,
      (user as any).password
    );

    if (!isValidPassword) {
      throw new AppErrorClass('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppErrorClass('User account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    // Check if user is Super Admin
    // First check if role exists
    const userRole = (user as any).role;
    const roleId = (user as any).roleId;
    const roleName = userRole?.name ? String(userRole.name).trim().toLowerCase() : '';
    
    // If role is not loaded but we have roleId, try to fetch it
    let isSuperAdmin = false;
    if (!userRole && roleId) {
      // @ts-ignore - Prisma client needs regeneration
      const fetchedRole = await (prisma as any).role.findUnique({
        where: { id: roleId },
        select: { name: true }
      });
      if (fetchedRole) {
        const fetchedRoleName = String(fetchedRole.name).trim().toLowerCase();
        isSuperAdmin = (
          fetchedRoleName.includes('super admin') || 
          fetchedRoleName.includes('superadmin') ||
          fetchedRoleName === 'admin' ||
          fetchedRoleName.includes('super') ||
          fetchedRoleName.startsWith('super') ||
          fetchedRoleName.endsWith('admin')
        );
      }
    } else if (roleName) {
      // Super Admin check - multiple patterns to catch all variations
      isSuperAdmin = (
        roleName.includes('super admin') || 
        roleName.includes('superadmin') ||
        roleName === 'admin' ||
        roleName.includes('super') ||
        roleName.startsWith('super') ||
        roleName.endsWith('admin')
      );
    }

    // Debug logging with more details
    logger.info('Login check:', {
      email: validated.email,
      userId: (user as any).id,
      roleId: (user as any).roleId,
      roleName: roleName || 'NO ROLE',
      originalRoleName: userRole?.name || 'NO ROLE',
      roleExists: !!userRole,
      roleObject: userRole,
      isSuperAdmin,
      tenantActive: (user as any).tenant?.isActive,
      tenantName: (user as any).tenant?.name,
      tenantId: (user as any).tenantId,
      willBypassTenantCheck: isSuperAdmin
    });

    // Special case: System tenant users should always be able to login (they are Super Admins)
    const isSystemTenant = (user as any).tenant?.name?.toLowerCase() === 'system';
    
    // Check if tenant is active (skip for Super Admin and System tenant users)
    if (!isSuperAdmin && !isSystemTenant && !(user as any).tenant?.isActive) {
      logger.warn('Login blocked - Tenant inactive:', {
        email: validated.email,
        isSuperAdmin,
        isSystemTenant,
        tenantActive: (user as any).tenant?.isActive,
        tenantName: (user as any).tenant?.name,
        roleName: roleName || 'NO ROLE'
      });
      throw new AppErrorClass('Tenant account is inactive', 403, 'TENANT_INACTIVE');
    }
    
    // If user is in System tenant, treat them as Super Admin even if role check failed
    if (isSystemTenant && !isSuperAdmin) {
      logger.info('System tenant user detected - allowing login despite role check:', {
        email: validated.email,
        roleName: roleName || 'NO ROLE',
        roleId: roleId
      });
      // Allow login for System tenant users
    }

    // Note: lastLoginAt doesn't exist in schema, so we skip updating it

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      companyId: user.tenantId,
      branchId: user.branchId || undefined,
      email: user.email,
      roleId: user.roleId || undefined,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Note: UserSession model not in schema yet, so we skip session creation
    // Tokens are still generated and returned to the client
    // TODO: Add UserSession model to schema if session tracking is needed
    // For now, tokens are stateless and validated via JWT signature

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string, token: string) {
    // Note: UserSession model not in schema yet
    // For stateless JWT tokens, logout is handled client-side by removing tokens
    // TODO: Add UserSession model to schema if server-side session invalidation is needed

    return { message: 'Logged out successfully' };
  }

  async refreshAccessToken(refreshToken: string) {
    // Verify refresh token
    const { verifyRefreshToken } = await import('../utils/auth.utils');
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database to verify they still exist and are active
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.findUnique({
      where: {
        id: decoded.userId,
      },
      include: {
        tenant: true,
        branch: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppErrorClass('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user is Super Admin
    // Trim whitespace and convert to lowercase for consistent checking
    const roleName = ((user as any).role?.name || '').trim().toLowerCase();
    const isSuperAdmin = 
      roleName.includes('super admin') || 
      roleName.includes('superadmin') ||
      roleName === 'admin' ||
      roleName.includes('super') ||
      roleName.startsWith('super') ||
      roleName.endsWith('admin');

    if (!user.isActive) {
      throw new AppErrorClass('User account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    // Check tenant active status (skip for Super Admin)
    if (!isSuperAdmin && !user.tenant?.isActive) {
      throw new AppErrorClass('Tenant account is inactive', 403, 'TENANT_INACTIVE');
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      companyId: user.tenantId,
      branchId: user.branchId || undefined,
      email: user.email,
      roleId: user.roleId || undefined,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Note: UserSession model not in schema yet, so we skip session update
    // Tokens are stateless and validated via JWT signature

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Register Super Admin (auto-creates system company and super admin role)
   */
  async registerSuperAdmin(data: z.infer<typeof superAdminRegisterSchema>) {
    try {
      // Validate input
      const validated = superAdminRegisterSchema.parse(data);

      // Check if super admin already exists (by email - globally unique)
      // @ts-ignore - Prisma client needs regeneration
      const existingUser = await (prisma as any).user.findFirst({
        where: {
          email: validated.email,
        },
      });

      if (existingUser) {
        throw new AppErrorClass('Super admin with this email already exists', 409, 'EMAIL_EXISTS');
      }

      // Get or create system company
      // @ts-ignore - Prisma client needs regeneration
      let systemCompany = await (prisma as any).tenant.findFirst({
        where: {
          name: 'System',
        },
      });

      if (!systemCompany) {
        // Create system company
        // @ts-ignore - Prisma client needs regeneration
        systemCompany = await (prisma as any).tenant.create({
          data: {
            name: 'System',
            plan: 'ADMIN',
            isActive: true,
          },
        });
      }

      // Get or create system branch
      // @ts-ignore - Prisma client needs regeneration
      let systemBranch = await (prisma as any).branch.findFirst({
        where: {
          tenantId: systemCompany.id,
          name: 'System Branch',
        },
      });

      if (!systemBranch) {
        // @ts-ignore - Prisma client needs regeneration
        systemBranch = await (prisma as any).branch.create({
          data: {
            tenantId: systemCompany.id,
            name: 'System Branch',
            isActive: true,
          },
        });
      }

      // Get or create Super Admin role
      // @ts-ignore - Prisma client needs regeneration
      let superAdminRole = await (prisma as any).role.findFirst({
        where: {
          tenantId: systemCompany.id,
          name: 'Super Admin',
        },
      });

      if (!superAdminRole) {
        // @ts-ignore - Prisma client needs regeneration
        superAdminRole = await (prisma as any).role.create({
          data: {
            tenantId: systemCompany.id,
            name: 'Super Admin',
          },
        });
      }

      // Hash password
      const passwordHash = await hashPassword(validated.password);

      // Generate email verification token
      const emailVerificationToken = generateRandomToken();
      const emailVerificationExpires = new Date();
      emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24); // Token expires in 24 hours

      // Create super admin user
      // Note: firstName, lastName, phone are not in User model schema yet
      // @ts-ignore - Prisma client needs regeneration
      const user = await (prisma as any).user.create({
        data: {
          email: validated.email,
          password: passwordHash,
          tenantId: systemCompany.id,
          branchId: systemBranch.id,
          roleId: superAdminRole.id,
          emailVerificationToken,
          emailVerificationExpires,
          emailVerified: false, // Super admins may need email verification too
        },
        include: {
          tenant: true,
          branch: true,
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        companyId: user.tenantId,
        branchId: user.branchId || undefined,
        email: user.email,
        roleId: user.roleId || undefined,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      // Log the actual error for debugging
      logger.error('registerSuperAdmin error:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      });

      // Re-throw AppError as-is
      if (error instanceof AppErrorClass) {
        throw error;
      }

      // Wrap other errors
      throw new AppErrorClass(
        error?.message || 'Failed to register super admin',
        500,
        'REGISTRATION_FAILED'
      );
    }
  }

  /**
   * Forgot password - Generate password reset token
   */
  async forgotPassword(data: z.infer<typeof forgotPasswordSchema>) {
    const validated = forgotPasswordSchema.parse(data);

    // Find user by email
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.findUnique({
      where: { email: validated.email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

    // Save reset token to user
    // @ts-ignore - Prisma client needs regeneration
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, send email)
    logger.info('Password reset token generated', {
      email: validated.email,
      token: resetToken, // Remove this in production
    });

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password using token
   */
  async resetPassword(data: z.infer<typeof resetPasswordSchema>) {
    const validated = resetPasswordSchema.parse(data);

    // Find user by reset token
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.findFirst({
      where: {
        passwordResetToken: validated.token,
        passwordResetExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new AppErrorClass('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Hash new password
    const passwordHash = await hashPassword(validated.password);

    // Update password and clear reset token
    // @ts-ignore - Prisma client needs regeneration
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Verify email using token
   */
  async verifyEmail(data: z.infer<typeof verifyEmailSchema>) {
    const validated = verifyEmailSchema.parse(data);

    // Find user by verification token
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.findFirst({
      where: {
        emailVerificationToken: validated.token,
        emailVerificationExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new AppErrorClass('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    // Mark email as verified and clear token
    // @ts-ignore - Prisma client needs regeneration
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(data: z.infer<typeof verifyOtpSchema>) {
    const validated = verifyOtpSchema.parse(data);

    // Find user by email
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      throw new AppErrorClass('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if OTP exists and is valid
    if (!user.otp || user.otp !== validated.otp) {
      throw new AppErrorClass('Invalid OTP', 400, 'INVALID_OTP');
    }

    // Check if OTP is expired
    if (!user.otpExpires || user.otpExpires < new Date()) {
      throw new AppErrorClass('OTP has expired', 400, 'OTP_EXPIRED');
    }

    // Clear OTP after successful verification
    // @ts-ignore - Prisma client needs regeneration
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpires: null,
      },
    });

    return { message: 'OTP verified successfully' };
  }

  /**
   * Send OTP to user email (helper method)
   * This can be called from forgot-password or other flows
   */
  async sendOtp(email: string): Promise<string> {
    // Find user by email
    // @ts-ignore - Prisma client needs regeneration
    const user = await (prisma as any).user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppErrorClass('User not found', 404, 'USER_NOT_FOUND');
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP expires in 10 minutes

    // Save OTP to user
    // @ts-ignore - Prisma client needs regeneration
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires,
      },
    });

    // TODO: Send OTP via email/SMS
    // For now, we'll just log it (in production, send via email/SMS)
    logger.info('OTP generated', {
      email,
      otp, // Remove this in production
    });

    return otp;
  }
}

export default new AuthService();
