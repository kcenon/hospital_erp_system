import { Injectable, Logger } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { ListUsersDto } from './dto';

/**
 * Repository for user admin operations
 * Reference: Issue #28 (User and Role Management Service)
 * Requirements: REQ-FR-060~061
 */
@Injectable()
export class UserAdminRepository {
  private readonly logger = new Logger(UserAdminRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by ID with roles
   */
  async findById(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find user by employee ID
   */
  async findByEmployeeId(employeeId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { employeeId },
    });
  }

  /**
   * Create a new user with roles
   */
  async create(data: CreateUserData): Promise<UserWithRoles> {
    const { roleIds, assignedBy, ...userData } = data;

    return this.prisma.user.create({
      data: {
        ...userData,
        userRoles: {
          create: roleIds.map((roleId) => ({
            roleId,
            assignedBy,
          })),
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update user data
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRoles> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete user (set deletedAt)
   */
  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * List users with pagination and filters
   */
  async findMany(params: ListUsersDto): Promise<{ users: UserWithRoles[]; total: number }> {
    const {
      search,
      department,
      isActive,
      roleId,
      page = 1,
      limit = 20,
      sortBy,
      sortOrder,
    } = params;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (roleId) {
      where.userRoles = {
        some: {
          roleId,
        },
      };
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy && ['name', 'username', 'employeeId', 'createdAt', 'lastLoginAt'].includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleId: string, assignedBy: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    });
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleId: string): Promise<boolean> {
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
    return !!userRole;
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<{ roleId: string; role: { code: string } }[]> {
    return this.prisma.userRole.findMany({
      where: { userId },
      select: {
        roleId: true,
        role: {
          select: {
            code: true,
          },
        },
      },
    });
  }

  /**
   * Count active admin users
   */
  async countActiveAdmins(): Promise<number> {
    return this.prisma.user.count({
      where: {
        isActive: true,
        deletedAt: null,
        userRoles: {
          some: {
            role: {
              code: 'ADMIN',
            },
          },
        },
      },
    });
  }

  /**
   * Count users with admin role
   */
  async countUsersWithAdminRole(): Promise<number> {
    return this.prisma.userRole.count({
      where: {
        role: {
          code: 'ADMIN',
        },
        user: {
          isActive: true,
          deletedAt: null,
        },
      },
    });
  }
}

/**
 * User with roles type
 */
export type UserWithRoles = User & {
  userRoles: {
    roleId: string;
    assignedAt: Date;
    assignedBy: string | null;
    role: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      level: number;
      isActive: boolean;
    };
  }[];
};

/**
 * Data for creating a user
 */
export interface CreateUserData {
  employeeId: string;
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  roleIds: string[];
  assignedBy: string;
}
