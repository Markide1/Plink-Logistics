/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { USER_ROLES } from '../common/constants';
import { CanUpdateUserGuard } from '../common/guards/can-update-user.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: `
      Retrieve a paginated list of all users in the system.
      Only accessible by admin users.
      
      **Features**:
      - Pagination support
      - Role-based filtering
      - Excludes deleted users
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter by user role (USER/ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Users fetched successfully',
        data: {
          users: [
            {
              id: 'uuid-string',
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
              phone: '+1234567890',
              role: 'USER',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z',
            },
          ],
          pagination: {
            total: 25,
            page: 1,
            limit: 10,
            totalPages: 3,
          },
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Access denied - Admin role required',
    schema: {
      example: {
        success: false,
        message: 'Forbidden',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        statusCode: 403,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getAllUsers(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('role') role?: string,
  ) {
    return this.usersService.getAllUsers(page, limit, role);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: `
      Retrieve detailed information about a specific user.
      Users can access their own profile, admins can access any user.
    `,
  })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User fetched successfully',
        data: {
          id: 'uuid-string',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          role: 'USER',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      example: {
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
        statusCode: 404,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  @UseGuards(CanUpdateUserGuard)
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiOperation({
    summary: 'Update user information',
    description: `
      Update user profile information.
      Users can update their own profile, admins can update any user.
      
      **Note**: Cannot change user role or email through this endpoint.
    `,
  })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data',
    examples: {
      update: {
        summary: 'Update user profile',
        value: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '+1234567890',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        success: true,
        message: 'User updated successfully',
        data: {
          id: 'uuid-string',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Smith',
          phone: '+1234567890',
          role: 'USER',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:30:00.000Z',
        },
        statusCode: 200,
        timestamp: '2024-01-15T11:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'First name must be at least 2 characters long',
        errorCode: 'VALIDATION_FAILED',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    // Add profile image to the DTO if provided
    if (profileImage) {
      updateUserDto.profileImage = profileImage;
    }
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user (Soft delete)',
    description: `
      Soft delete a user account. The user will be marked as deleted but data is preserved.
      
      **Restrictions**:
      - Admin accounts cannot be deleted
      - Only accessible by admins
    `,
  })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Cannot delete admin account',
    schema: {
      example: {
        success: false,
        message:
          'Admin accounts cannot be deleted. This operation is not permitted for security reasons.',
        errorCode: 'USER_ADMIN_DELETION_FORBIDDEN',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Get(':id/parcels')
  @ApiOperation({
    summary: 'Get user parcels',
    description: `
      Retrieve parcels associated with a user.
      Can filter by 'sent' or 'received' parcels.
    `,
  })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Parcel type filter',
    enum: ['sent', 'received'],
    example: 'sent',
  })
  @ApiResponse({
    status: 200,
    description: 'User parcels retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Parcels fetched successfully',
        data: {
          parcels: [
            {
              id: 'uuid-string',
              trackingNumber: 'ST12345678ABC',
              description: 'Electronics package',
              weight: 2.5,
              price: 25.0,
              status: 'IN_TRANSIT',
              pickupLocation: '123 Main St',
              destinationLocation: '456 Oak Ave',
              sender: {
                id: 'uuid-string',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
              },
              receiver: {
                id: 'uuid-string',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
              },
              createdAt: '2024-01-15T10:30:00.000Z',
            },
          ],
          type: 'sent',
          count: 5,
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getUserParcels(
    @Param('id') id: string,
    @Query('type') type: 'sent' | 'received' = 'sent',
  ) {
    return this.usersService.getUserParcels(id, type);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get user statistics',
    description: `
      Retrieve statistical information about a user's parcel activity.
      Includes sent/received counts and pending status counts.
    `,
  })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User statistics fetched successfully',
        data: {
          totalSent: 15,
          totalReceived: 8,
          pendingSent: 3,
          pendingReceived: 1,
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Put('change-password/:id')
  @UseGuards(CanUpdateUserGuard)
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Allows a user to change their password. Current password is optional but recommended for security. Admins can change any user password.',
  })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPassword: {
          type: 'string',
          description:
            'Current password (optional but recommended for security)',
          example: 'oldPassword',
        },
        newPassword: {
          type: 'string',
          description: 'New password (required)',
          example: 'newPassword',
        },
      },
      required: ['newPassword'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
        statusCode: 200,
        timestamp: '2025-07-24T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'New password is required',
        errorCode: 'VALIDATION_FAILED',
        statusCode: 400,
        timestamp: '2025-07-24T10:30:00.000Z',
      },
    },
  })
  async changePassword(@Param('id') id: string, @Body() body: any = {}) {
    return this.usersService.changePassword(id, body);
  }
}
