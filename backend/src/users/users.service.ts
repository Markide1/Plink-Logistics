/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommonHelpers } from '../common/helpers';
import { RESPONSE_MESSAGES, USER_ROLES } from '../common/constants';
import { UpdateUserDto } from './dto/user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prismaService: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    role?: string,
    ...rest: any[]
  ) {
    const skip = (page - 1) * limit;
    const search: string | undefined =
      typeof rest[0] === 'string' ? rest[0] : undefined;
    const isActive: boolean | undefined =
      typeof rest[1] === 'boolean' ? rest[1] : undefined;

    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    if (role && (Object.values(USER_ROLES) as string[]).includes(role)) {
      whereClause.role = role as (typeof USER_ROLES)[keyof typeof USER_ROLES];
    }
    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          profileImage: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.user.count({
        where: whereClause,
      }),
    ]);

    return CommonHelpers.createResponse(true, RESPONSE_MESSAGES.USERS_FETCHED, {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async getUserById(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    return CommonHelpers.createResponse(true, RESPONSE_MESSAGES.USER_FETCHED, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      profileImage: user.profileImage,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const { newPassword, profileImage, ...restUpdates } = updateUserDto;

    if (newPassword) {
      const saltRounds = 12;
      (restUpdates as any).password = await bcrypt.hash(
        newPassword,
        saltRounds,
      );
    }

    if (profileImage) {
      if (typeof profileImage === 'string') {
        // Already a URL, just set it
        (restUpdates as any).profileImage = profileImage;
      } else {
        // File upload
        const cloudinaryResult =
          await this.cloudinaryService.uploadImage(profileImage);
        (restUpdates as any).profileImage = cloudinaryResult.url;
      }
    }
    const user = await this.prismaService.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    try {
      const updatedUser = await this.prismaService.user.update({
        where: { id },
        data: { ...restUpdates, updatedAt: new Date() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          profileImage: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return CommonHelpers.createResponse(
        true,
        RESPONSE_MESSAGES.USER_UPDATED,
        updatedUser,
      );
    } catch (error) {
      this.logger.error('Failed to update user:', error);
      throw new BadRequestException('Failed to update user');
    }
  }

  async deleteUser(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    // Prevent deletion of admin accounts
    if (user.role === USER_ROLES.ADMIN) {
      throw new BadRequestException('Admin accounts cannot be deleted.');
    }

    // Soft delete: set isDeleted true, set deletedAt
    await this.prismaService.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { success: true, message: 'User deleted successfully' };
  }

  async getUserParcels(userId: string, type: 'sent' | 'received') {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    const whereClause =
      type === 'sent'
        ? { senderId: userId, isDeleted: false }
        : { receiverId: userId, isDeleted: false };

    const parcels = await this.prismaService.parcel.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return CommonHelpers.createResponse(
      true,
      RESPONSE_MESSAGES.PARCELS_FETCHED,
      {
        parcels,
        type,
        count: parcels.length,
      },
    );
  }

  async getUserStats(userId: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    const [sentCount, receivedCount, sentPending, receivedPending] =
      await Promise.all([
        this.prismaService.parcel.count({
          where: { senderId: userId, isDeleted: false },
        }),
        this.prismaService.parcel.count({
          where: { receiverId: userId, isDeleted: false },
        }),
        this.prismaService.parcel.count({
          where: { senderId: userId, status: 'PENDING', isDeleted: false },
        }),
        this.prismaService.parcel.count({
          where: { receiverId: userId, status: 'PENDING', isDeleted: false },
        }),
      ]);

    return CommonHelpers.createResponse(
      true,
      'User statistics fetched successfully',
      {
        totalSent: sentCount,
        totalReceived: receivedCount,
        pendingSent: sentPending,
        pendingReceived: receivedPending,
      },
    );
  }
  async changePassword(
    id: string,
    body: { currentPassword?: string; newPassword?: string } = {},
  ) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body is missing or invalid');
    }
    const { currentPassword, newPassword } = body;

    // Only require new password now
    if (!newPassword) {
      throw new BadRequestException('New password is required');
    }

    const user = await this.prismaService.user.findFirst({
      where: { id, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    // If current password is provided, validate it (for extra security)
    if (currentPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await this.prismaService.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
    return CommonHelpers.createResponse(
      true,
      'Password changed successfully',
      undefined,
      200,
    );
  }
}
