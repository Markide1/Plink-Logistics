import { ForbiddenException } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  Put,
  NotFoundException,
  Req,
} from '@nestjs/common';
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
import { ParcelsService } from './parcels.service';
import {
  CreateParcelDto,
  UpdateParcelStatusDto,
  ParcelQueryDto,
  CreateParcelSchema,
  UpdateParcelStatusSchema,
  BulkUpdateParcelStatusDto,
} from './dto/parcel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { USER_ROLES } from '../common/constants';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Parcels')
@Controller('parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Get('/track/:trackingNumber')
  @Public()
  @ApiOperation({
    summary: 'Track parcel by tracking number',
    description: `
      Retrieve parcel details using tracking number. 
      Publicly accessible without authentication.
    `,
  })
  @ApiParam({ name: 'trackingNumber', description: 'Parcel Tracking Number' })
  @ApiResponse({
    status: 200,
    description: 'Tracking information retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Tracking information retrieved successfully',
        data: {
          id: 'uuid-string-1',
          trackingNumber: 'ST12345678ABC',
          description: 'Electronics package',
          weight: 2.5,
          price: 25.0,
          status: 'IN_TRANSIT',
          pickupLocation: '123 Main St, NYC',
          destinationLocation: '456 Oak Ave, LA',
          sender: {
            id: 'sender-uuid',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          receiver: {
            id: 'receiver-uuid',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Parcel not found',
    schema: {
      example: {
        success: false,
        message: 'Parcel not found',
        errorCode: 'PARCEL_NOT_FOUND',
        statusCode: 404,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async trackParcel(@Param('trackingNumber') trackingNumber: string) {
    return this.parcelsService.trackParcelByNumber(trackingNumber);
  }

  @Post()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create a new parcel (Admin only)',
    description: `
      Create a new parcel delivery order directly. This is for immediate parcel creation
      where the admin knows both sender and receiver exist in the system.
      
      **Features**:
      - Automatic geocoding of pickup/destination addresses
      - Weight-based pricing calculation
      - Unique tracking number generation
      - Email notifications to sender and receiver
      - Distance calculation for delivery estimates
      
      **Note**: For unknown receivers, use the parcel request system instead.
    `,
  })
  @ApiBody({
    type: CreateParcelDto,
    description: 'Parcel creation data',
    examples: {
      standard: {
        summary: 'Standard parcel delivery',
        value: {
          receiverEmail: 'receiver@example.com',
          description: 'Electronics package - laptop and accessories',
          weight: 3.5,
          pickupLocation: '123 Main Street, New York, NY 10001',
          destinationLocation: '456 Oak Avenue, Los Angeles, CA 90001',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          destinationLatitude: 34.0522,
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Search and filter parcels',
    description: `
      Search through parcels with various filtering options.
      Results are paginated and sorted by creation date (newest first).
      
      **Filtering Options**:
      - By status (PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED)
      - By tracking number (exact match)
      - By sender ID
      - By receiver ID
      - Pagination with page and limit
    `,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by parcel status',
    enum: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
  })
  @ApiQuery({
    name: 'trackingNumber',
    required: false,
    description: 'Search by tracking number',
  })
  @ApiQuery({
    name: 'senderId',
    required: false,
    description: 'Filter by sender ID',
  })
  @ApiQuery({
    name: 'receiverId',
    required: false,
    description: 'Filter by receiver ID',
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
  @ApiResponse({
    status: 200,
    description: 'Parcels retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Parcels fetched successfully',
        data: {
          parcels: [
            {
              id: 'uuid-string-1',
              trackingNumber: 'ST12345678ABC',
              description: 'Electronics package',
              weight: 2.5,
              price: 25.0,
              status: 'IN_TRANSIT',
              pickupLocation: '123 Main St, NYC',
              destinationLocation: '456 Oak Ave, LA',
              sender: {
                id: 'sender-uuid',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
              },
              receiver: {
                id: 'receiver-uuid',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
              },
              createdAt: '2024-01-15T10:30:00.000Z',
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
  async createParcel(
    @Body() createParcelDto: CreateParcelDto,
    @CurrentUser() user: { id: string },
  ) {
    const { error, value } = CreateParcelSchema.validate(createParcelDto);
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.parcelsService.createParcel(user.id, value);
  }

  @Get()
  @ApiOperation({
    summary: 'Search and filter parcels',
    description: `
      Search through parcels with various filtering options.
      Results are paginated and sorted by creation date (newest first).
      
      **Filtering Options**:
      - By status (PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED)
      - By tracking number (exact match)
      - By sender ID
      - By receiver ID
      - Pagination with page and limit
    `,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by parcel status',
    enum: ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
  })
  @ApiQuery({
    name: 'trackingNumber',
    required: false,
    description: 'Search by tracking number',
  })
  @ApiQuery({
    name: 'senderId',
    required: false,
    description: 'Filter by sender ID',
  })
  @ApiQuery({
    name: 'receiverId',
    required: false,
    description: 'Filter by receiver ID',
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
  @ApiResponse({
    status: 200,
    description: 'Parcels retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Parcels fetched successfully',
        data: {
          parcels: [
            {
              id: 'uuid-string-1',
              trackingNumber: 'ST12345678ABC',
              description: 'Electronics package',
              weight: 2.5,
              price: 25.0,
              status: 'IN_TRANSIT',
              pickupLocation: '123 Main St, NYC',
              destinationLocation: '456 Oak Ave, LA',
              sender: {
                id: 'sender-uuid',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
              },
              receiver: {
                id: 'receiver-uuid',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
              },
              createdAt: '2024-01-15T10:30:00.000Z',
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
  async getParcels(@Req() req, @Query() query: ParcelQueryDto) {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const isAdmin = req.user?.role === USER_ROLES.ADMIN;
    return this.parcelsService.searchParcels(query, userId, userEmail, isAdmin);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get parcel details by ID',
    description: `
      Retrieve detailed information about a specific parcel including:
      - Complete parcel information
      - Sender and receiver details
      - Pickup and destination locations with coordinates
      - Calculated distance between locations
    `,
  })
  @ApiParam({ name: 'id', description: 'Parcel ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Parcel retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Parcel not found',
  })
  async getParcelById(@Param('id') id: string, @Req() req) {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    return this.parcelsService.getParcelById(id, userId, userEmail);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update parcel status',
    description: `Update the status of a parcel.`,
  })
  @ApiParam({ name: 'id', description: 'Parcel ID (UUID)' })
  @ApiBody({
    type: UpdateParcelStatusDto,
    description: 'Status update data',
    examples: {
      pickedUp: {
        summary: 'Mark as picked up',
        value: { status: 'PICKED_UP' },
      },
      inTransit: {
        summary: 'Mark as in transit',
        value: { status: 'IN_TRANSIT' },
      },
      delivered: {
        summary: 'Mark as delivered',
        value: { status: 'DELIVERED' },
      },
      cancelled: {
        summary: 'Cancel delivery',
        value: { status: 'CANCELLED' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Parcel status updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid status value',
  })
  @ApiNotFoundResponse({
    description: 'Parcel not found',
  })
  async updateParcelStatus(
    @Param('id') id: string,
    @Body() updateParcelStatusDto: UpdateParcelStatusDto,
  ) {
    const { error, value } = UpdateParcelStatusSchema.validate(
      updateParcelStatusDto,
    );
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.parcelsService.updateParcelStatus(id, value);
  }

  @Put('bulk-update-status')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Bulk update status for multiple parcels (Admin only)',
    description: 'Update the status of multiple parcels in a single request.',
  })
  @ApiBody({
    type: BulkUpdateParcelStatusDto,
    description: 'Bulk status update data',
    examples: {
      pickedUp: {
        summary: 'Mark as picked up',
        value: { parcelIds: ['id1', 'id2'], status: 'PICKED_UP' },
      },
      inTransit: {
        summary: 'Mark as in transit',
        value: { parcelIds: ['id1', 'id2'], status: 'IN_TRANSIT' },
      },
      delivered: {
        summary: 'Mark as delivered',
        value: { parcelIds: ['id1', 'id2'], status: 'DELIVERED' },
      },
      cancelled: {
        summary: 'Cancel delivery',
        value: { parcelIds: ['id1', 'id2'], status: 'CANCELLED' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk status update result',
    schema: {
      example: {
        message: 'Updated 3 parcels',
        updatedCount: 3,
      },
    },
  })
  async bulkUpdateStatus(@Body() bulkUpdateDto: any) {
    const { BulkUpdateParcelStatusSchema } = await import('./dto/parcel.dto');
    const { error, value } =
      BulkUpdateParcelStatusSchema.validate(bulkUpdateDto);
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.parcelsService.bulkUpdateStatus(value.parcelIds, value.status);
  }
  @Delete(':id')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete parcel (Soft delete - Admin only)',
    description: `
      Soft delete a parcel from the system. The parcel will be marked as deleted
      but all data is preserved for audit purposes.
      
      **Important Notes**:
      - This is a soft delete operation (data is preserved)
      - Only admins can delete parcels
      - Deleted parcels won't appear in normal searches
      - This action cannot be undone through the API
    `,
  })
  @ApiParam({ name: 'id', description: 'Parcel ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Parcel deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Parcel deleted successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Parcel not found',
    schema: {
      example: {
        success: false,
        message: 'Parcel not found',
        errorCode: 'PARCEL_NOT_FOUND',
        statusCode: 404,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Admin role required',
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
  async deleteParcel(@Param('id') id: string) {
    return this.parcelsService.deleteParcel(id);
  }

  @Put(':id/received')
  @ApiOperation({
    summary: 'Mark parcel as received (User only)',
    description: 'Mark a delivered parcel as received by the receiver.',
  })
  @ApiParam({ name: 'id', description: 'Parcel ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Parcel marked as received successfully',
  })
  @ApiNotFoundResponse({
    description: 'Parcel not found',
  })
  async markAsReceived(@Param('id') id: string, @Req() req) {
    // Only allow if parcel is DELIVERED and user is receiver
    const userId = req.user?.id;
    const parcelRes = await this.parcelsService.getParcelById(id, userId);
    const parcel = parcelRes?.data;
    if (!parcel || parcel.status !== 'DELIVERED') {
      throw new NotFoundException('Parcel not found or not delivered');
    }
    if (!userId || !parcel.receiver || parcel.receiver.id !== userId) {
      throw new ForbiddenException('Only the receiver can mark as received');
    }
    // Call service to update status to RECEIVED
    return this.parcelsService.updateParcelStatus(id, { status: 'RECEIVED' });
  }
}
