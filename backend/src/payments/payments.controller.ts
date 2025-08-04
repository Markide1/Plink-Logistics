/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentStatus, UserRole } from '@prisma/client';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new payment for a parcel',
    description:
      'Create a new payment entry for a specific parcel. Only the parcel sender can create a payment for their parcel.',
  })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Payment creation data',
    examples: {
      basic: {
        summary: 'Basic payment creation',
        description: 'Create a payment with minimum required fields',
        value: {
          parcelId: 'clx123456789',
          amount: 25.99,
          method: 'CARD',
          description: 'Payment for parcel delivery',
        },
      },
      withMetadata: {
        summary: 'Payment with metadata',
        description: 'Create a payment with additional metadata',
        value: {
          parcelId: 'clx123456789',
          amount: 45.5,
          method: 'MOBILE_MONEY',
          description: 'Express delivery payment',
          metadata: {
            phoneNumber: '+256701234567',
            provider: 'MTN',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment created successfully.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx987654321' },
        parcelId: { type: 'string', example: 'clx123456789' },
        amount: { type: 'number', example: 25.99 },
        status: {
          type: 'string',
          enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
          example: 'PENDING',
        },
        method: {
          type: 'string',
          enum: ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'],
          example: 'CARD',
        },
        description: { type: 'string', example: 'Payment for parcel delivery' },
        transactionRef: { type: 'string', nullable: true, example: null },
        metadata: { type: 'object', nullable: true, example: null },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
        },
        parcel: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx123456789' },
            trackingNumber: { type: 'string', example: 'TRK001234567' },
            description: { type: 'string', example: 'Electronics package' },
            status: { type: 'string', example: 'PENDING' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or payment already exists for parcel.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Payment already exists for this parcel',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parcel not found.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Parcel not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Cannot create payment for parcel that does not belong to you.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example:
            'Cannot create payment for parcel that does not belong to you',
        },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(createPaymentDto, user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all payments (admin) or user payments (regular user)',
    description:
      'Retrieve payments based on user role. Admins see all payments, regular users see only their own payments. Can be filtered by status.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PaymentStatus,
    description:
      'Filter payments by status (PENDING, COMPLETED, FAILED, CANCELLED)',
    example: 'PENDING',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx987654321' },
          parcelId: { type: 'string', example: 'clx123456789' },
          amount: { type: 'number', example: 25.99 },
          status: {
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
            example: 'COMPLETED',
          },
          method: {
            type: 'string',
            enum: ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'],
            example: 'CARD',
          },
          description: {
            type: 'string',
            example: 'Payment for parcel delivery',
          },
          transactionRef: {
            type: 'string',
            nullable: true,
            example: 'TXN123456789',
          },
          metadata: { type: 'object', nullable: true },
          processedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-01-15T11:00:00Z',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T11:00:00Z',
          },
          parcel: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clx123456789' },
              trackingNumber: { type: 'string', example: 'TRK001234567' },
              description: { type: 'string', example: 'Electronics package' },
              status: { type: 'string', example: 'IN_TRANSIT' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  findAll(@CurrentUser() user: any, @Query('status') status?: PaymentStatus) {
    if (status) {
      return this.paymentsService.getPaymentsByStatus(
        status,
        user.role,
        user.sub,
      );
    }
    return this.paymentsService.findAll(user.sub, user.role);
  }

  @Get('my-payments')
  @ApiOperation({ summary: 'Get current user payments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User payments retrieved successfully.',
  })
  getUserPayments(@CurrentUser() user: any) {
    return this.paymentsService.getUserPayments(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot view payment that does not belong to you.',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id, user.sub, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update completed payment.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update payment that does not belong to you.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.update(
      id,
      updatePaymentDto,
      user.sub,
      user.role,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete completed payment.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete payment that does not belong to you.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.remove(id, user.sub, user.role);
  }

  @Post(':id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Process a payment (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment processed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment is not in pending status.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required.',
  })
  processPayment(
    @Param('id') id: string,
    @Body() body: { transactionRef: string; metadata?: any },
  ) {
    return this.paymentsService.processPayment(id, body.transactionRef);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get payments by status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully.',
  })
  getPaymentsByStatus(
    @Param('status') status: PaymentStatus,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.getPaymentsByStatus(
      status,
      user.role,
      user.sub,
    );
  }
}
