/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ParcelRequestsService } from './parcel-requests.service';
import {
  CreateParcelRequestDto,
  UpdateParcelRequestStatusDto,
  ParcelRequestQueryDto,
  CreateParcelFromRequestDto,
  CreateParcelRequestSchema,
  UpdateParcelRequestStatusSchema,
  CreateParcelFromRequestSchema,
} from './dto/parcel-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { USER_ROLES } from '../common/constants';

@ApiTags('Parcel Requests')
@Controller('parcel-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ParcelRequestsController {
  constructor(private readonly parcelRequestsService: ParcelRequestsService) {}

  @Post()
  @Roles(USER_ROLES.USER, USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create a new parcel request',
    description:
      'Creates a new parcel request with pickup and delivery details. Users can only create requests for themselves.',
  })
  @ApiBody({
    type: CreateParcelRequestDto,
    description: 'Parcel request creation data',
    examples: {
      'document-delivery': {
        summary: 'Document delivery request',
        value: {
          senderName: 'John Doe',
          senderPhone: '+1234567890',
          senderEmail: 'john.doe@example.com',
          senderAddress: '123 Main St, City, State 12345',
          receiverName: 'Jane Smith',
          receiverPhone: '+0987654321',
          receiverEmail: 'jane.smith@example.com',
          receiverAddress: '456 Oak Ave, City, State 67890',
          parcelDescription: 'Important legal documents',
          parcelWeight: 0.5,
          parcelCategory: 'documents',
          specialInstructions: 'Handle with care, confidential',
          preferredPickupTime: '2024-01-15T10:00:00Z',
          preferredDeliveryTime: '2024-01-15T16:00:00Z',
        },
      },
      'package-delivery': {
        summary: 'Package delivery request',
        value: {
          senderName: 'Alice Johnson',
          senderPhone: '+1122334455',
          senderEmail: 'alice.johnson@example.com',
          senderAddress: '789 Pine St, City, State 11111',
          receiverName: 'Bob Wilson',
          receiverPhone: '+5544332211',
          receiverEmail: 'bob.wilson@example.com',
          receiverAddress: '321 Elm St, City, State 22222',
          parcelDescription: 'Electronics and accessories',
          parcelWeight: 2.5,
          parcelCategory: 'electronics',
          specialInstructions: 'Fragile items, please handle carefully',
          preferredPickupTime: '2024-01-16T09:00:00Z',
          preferredDeliveryTime: '2024-01-16T17:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Parcel request created successfully',
    example: {
      success: true,
      message: 'Parcel request created successfully',
      data: {
        id: 'pr_1234567890',
        senderName: 'John Doe',
        senderPhone: '+1234567890',
        senderEmail: 'john.doe@example.com',
        senderAddress: '123 Main St, City, State 12345',
        receiverName: 'Jane Smith',
        receiverPhone: '+0987654321',
        receiverEmail: 'jane.smith@example.com',
        receiverAddress: '456 Oak Ave, City, State 67890',
        parcelDescription: 'Important legal documents',
        parcelWeight: 0.5,
        parcelCategory: 'documents',
        specialInstructions: 'Handle with care, confidential',
        preferredPickupTime: '2024-01-15T10:00:00Z',
        preferredDeliveryTime: '2024-01-15T16:00:00Z',
        status: 'pending',
        userId: 'user_123',
        createdAt: '2024-01-14T12:00:00Z',
        updatedAt: '2024-01-14T12:00:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
    example: {
      success: false,
      message: 'Validation failed: senderPhone must be a valid phone number',
      statusCode: 400,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    example: {
      success: false,
      message: 'Unauthorized',
      statusCode: 401,
    },
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
    example: {
      success: false,
      message: 'Forbidden resource',
      statusCode: 403,
    },
  })
  async createParcelRequest(
    @Body() createParcelRequestDto: CreateParcelRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    const { error, value } = CreateParcelRequestSchema.validate(
      createParcelRequestDto,
    );
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.parcelRequestsService.createParcelRequest(user.id, value);
  }

  @Get()
  @ApiOperation({
    summary: 'Get parcel requests with filtering',
    description:
      'Retrieves parcel requests with optional filtering. Users can only see their own requests, admins can see all requests.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
    description: 'Filter by parcel request status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Number of items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description:
      'Search in sender/receiver names, addresses, or parcel description',
  })
  @ApiResponse({
    status: 200,
    description: 'Parcel requests retrieved successfully',
    example: {
      success: true,
      message: 'Parcel requests retrieved successfully',
      data: {
        parcelRequests: [
          {
            id: 'pr_1234567890',
            senderName: 'John Doe',
            senderPhone: '+1234567890',
            senderEmail: 'john.doe@example.com',
            senderAddress: '123 Main St, City, State 12345',
            receiverName: 'Jane Smith',
            receiverPhone: '+0987654321',
            receiverEmail: 'jane.smith@example.com',
            receiverAddress: '456 Oak Ave, City, State 67890',
            parcelDescription: 'Important documents',
            parcelWeight: 0.5,
            parcelCategory: 'documents',
            specialInstructions: 'Handle with care',
            preferredPickupTime: '2024-01-15T10:00:00Z',
            preferredDeliveryTime: '2024-01-15T16:00:00Z',
            status: 'pending',
            userId: 'user_123',
            createdAt: '2024-01-14T12:00:00Z',
            updatedAt: '2024-01-14T12:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 45,
          itemsPerPage: 10,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    example: {
      success: false,
      message: 'Unauthorized',
      statusCode: 401,
    },
  })
  async getParcelRequests(
    @Query() query: ParcelRequestQueryDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.parcelRequestsService.getParcelRequests(
      query,
      user.role,
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific parcel request by ID',
    description:
      'Retrieves detailed information about a specific parcel request. Users can only view their own requests, admins can view any request.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the parcel request',
    example: 'pr_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Parcel request retrieved successfully',
    example: {
      success: true,
      message: 'Parcel request retrieved successfully',
      data: {
        id: 'pr_1234567890',
        senderName: 'John Doe',
        senderPhone: '+1234567890',
        senderEmail: 'john.doe@example.com',
        senderAddress: '123 Main St, City, State 12345',
        receiverName: 'Jane Smith',
        receiverPhone: '+0987654321',
        receiverEmail: 'jane.smith@example.com',
        receiverAddress: '456 Oak Ave, City, State 67890',
        parcelDescription: 'Important legal documents',
        parcelWeight: 0.5,
        parcelCategory: 'documents',
        specialInstructions: 'Handle with care, confidential',
        preferredPickupTime: '2024-01-15T10:00:00Z',
        preferredDeliveryTime: '2024-01-15T16:00:00Z',
        status: 'pending',
        userId: 'user_123',
        createdAt: '2024-01-14T12:00:00Z',
        updatedAt: '2024-01-14T12:00:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Parcel request not found',
    example: {
      success: false,
      message: 'Parcel request not found',
      statusCode: 404,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    example: {
      success: false,
      message: 'Unauthorized',
      statusCode: 401,
    },
  })
  @ApiForbiddenResponse({
    description: 'Access denied - can only view your own requests',
    example: {
      success: false,
      message: 'Access denied',
      statusCode: 403,
    },
  })
  async getParcelRequestById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.parcelRequestsService.getParcelRequestById(
      id,
      user.role,
      user.id,
    );
  }

  @Put(':id/status')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update parcel request status (Admin only)',
    description:
      'Updates the status of a parcel request. Only admins can perform this action. Can approve or reject pending requests.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the parcel request',
    example: 'pr_1234567890',
  })
  @ApiBody({
    type: UpdateParcelRequestStatusDto,
    description: 'Status update data',
    examples: {
      approve: {
        summary: 'Approve parcel request',
        value: {
          status: 'approved',
          adminComments: 'Request approved. Valid documentation provided.',
        },
      },
      reject: {
        summary: 'Reject parcel request',
        value: {
          status: 'rejected',
          adminComments:
            'Request rejected. Insufficient delivery details provided.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Parcel request status updated successfully',
    example: {
      success: true,
      message: 'Parcel request status updated successfully',
      data: {
        id: 'pr_1234567890',
        senderName: 'John Doe',
        senderPhone: '+1234567890',
        senderEmail: 'john.doe@example.com',
        senderAddress: '123 Main St, City, State 12345',
        receiverName: 'Jane Smith',
        receiverPhone: '+0987654321',
        receiverEmail: 'jane.smith@example.com',
        receiverAddress: '456 Oak Ave, City, State 67890',
        parcelDescription: 'Important documents',
        parcelWeight: 0.5,
        parcelCategory: 'documents',
        status: 'approved',
        adminComments: 'Request approved. Valid documentation provided.',
        userId: 'user_123',
        createdAt: '2024-01-14T12:00:00Z',
        updatedAt: '2024-01-14T14:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Parcel request not found',
    example: {
      success: false,
      message: 'Parcel request not found',
      statusCode: 404,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    example: {
      success: false,
      message: 'Unauthorized',
      statusCode: 401,
    },
  })
  @ApiForbiddenResponse({
    description: 'Access denied - admin privileges required',
    example: {
      success: false,
      message: 'Forbidden resource',
      statusCode: 403,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid status or validation error',
    example: {
      success: false,
      message: 'Validation failed: status must be either approved or rejected',
      statusCode: 400,
    },
  })
  async updateParcelRequestStatus(
    @Param('id') id: string,
    @Body() updateParcelRequestStatusDto: UpdateParcelRequestStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    const { error, value } = UpdateParcelRequestStatusSchema.validate(
      updateParcelRequestStatusDto,
    );
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.parcelRequestsService.updateParcelRequestStatus(
      id,
      value,
      user.id,
    );
  }

  @Post('create-parcel')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create parcel from approved request (Admin only)',
    description:
      'Creates a new parcel in the system based on an approved parcel request. This converts a parcel request into an active parcel for tracking and delivery. Only admins can perform this action.',
  })
  @ApiBody({
    type: CreateParcelFromRequestDto,
    description: 'Parcel creation data from request',
    examples: {
      'create-from-request': {
        summary: 'Create parcel from approved request',
        value: {
          parcelRequestId: 'pr_1234567890',
          trackingNumber: 'SIT-2024-0001',
          estimatedDeliveryDate: '2024-01-16T18:00:00Z',
          deliveryInstructions: 'Leave at front desk if recipient unavailable',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Parcel created successfully from request',
    example: {
      success: true,
      message: 'Parcel created successfully from request',
      data: {
        parcel: {
          id: 'pcl_9876543210',
          trackingNumber: 'SIT-2024-0001',
          senderName: 'John Doe',
          senderPhone: '+1234567890',
          senderAddress: '123 Main St, City, State 12345',
          receiverName: 'Jane Smith',
          receiverPhone: '+0987654321',
          receiverAddress: '456 Oak Ave, City, State 67890',
          description: 'Important documents',
          weight: 0.5,
          category: 'documents',
          status: 'pending_pickup',
          estimatedDeliveryDate: '2024-01-16T18:00:00Z',
          deliveryInstructions: 'Leave at front desk if recipient unavailable',
          userId: 'user_123',
          createdAt: '2024-01-14T15:00:00Z',
          updatedAt: '2024-01-14T15:00:00Z',
        },
        parcelRequest: {
          id: 'pr_1234567890',
          status: 'converted_to_parcel',
          updatedAt: '2024-01-14T15:00:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Parcel request not found or not approved',
    example: {
      success: false,
      message: 'Parcel request not found or not in approved status',
      statusCode: 404,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    example: {
      success: false,
      message: 'Unauthorized',
      statusCode: 401,
    },
  })
  @ApiForbiddenResponse({
    description: 'Access denied - admin privileges required',
    example: {
      success: false,
      message: 'Forbidden resource',
      statusCode: 403,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or parcel request already converted',
    example: {
      success: false,
      message: 'Validation failed: parcelRequestId is required',
      statusCode: 400,
    },
  })
  async createParcelFromRequest(
    @Body() createParcelFromRequestDto: CreateParcelFromRequestDto,
  ) {
    const { error, value } = CreateParcelFromRequestSchema.validate(
      createParcelFromRequestDto,
    );
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.parcelRequestsService.createParcelFromRequest(value);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a parcel request',
    description:
      'Deletes a parcel request from the system. Users can only delete their own parcel requests, while admins can delete any parcel request. Once deleted, the request cannot be recovered.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the parcel request to delete',
    type: 'string',
    example: 'pr_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Parcel request deleted successfully',
    example: {
      success: true,
      message: 'Parcel request deleted successfully',
      data: {
        deletedParcelRequest: {
          id: 'pr_1234567890',
          senderName: 'John Doe',
          status: 'pending',
          deletedAt: '2024-01-14T15:00:00Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Parcel request not found',
    example: {
      success: false,
      message: 'Parcel request not found',
      statusCode: 404,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
    example: {
      success: false,
      message: 'Unauthorized',
      statusCode: 401,
    },
  })
  @ApiForbiddenResponse({
    description:
      'Access denied - can only delete own parcel requests unless admin',
    example: {
      success: false,
      message: 'Forbidden - You can only delete your own parcel requests',
      statusCode: 403,
    },
  })
  @ApiBadRequestResponse({
    description:
      'Cannot delete parcel request that has been approved or converted',
    example: {
      success: false,
      message:
        'Cannot delete parcel request - already approved or converted to parcel',
      statusCode: 400,
    },
  })
  async deleteParcelRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.parcelRequestsService.deleteParcelRequest(
      id,
      user.id,
      user.role,
    );
  }
}
