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
  Request,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('average-rating')
  @ApiOperation({ summary: 'Get average review rating and total count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Average rating and total reviews',
    schema: {
      type: 'object',
      properties: {
        averageRating: { type: 'number' },
        totalReviews: { type: 'number' },
      },
    },
  })
  async getAverageRating(): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    return this.reviewsService.getAverageRating();
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new review for a parcel',
    description: `
      Create a new review for a delivered parcel. Only the sender or receiver of the parcel
      can create a review, and only after the parcel has been delivered.
      
      **Note**: Users can only create one review per parcel.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review created successfully',
    schema: {
      example: {
        success: true,
        message: 'Review created successfully',
        data: {
          id: 'clx123456789',
          parcelId: 'clx987654321',
          rating: 5,
          comment:
            'Excellent service! Package delivered on time and in perfect condition.',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          user: {
            id: 'clx111222333',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'USER',
          },
          parcel: {
            id: 'clx987654321',
            trackingNumber: 'TRK001234567',
            description: 'Electronics package',
            status: 'DELIVERED',
          },
        },
        statusCode: 201,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid JWT token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
        errorCode: 'AUTH_UNAUTHORIZED',
        statusCode: 401,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or duplicate review',
    schema: {
      example: {
        success: false,
        message: 'You have already reviewed this parcel',
        errorCode: 'REVIEW_ALREADY_EXISTS',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot review parcel you are not associated with',
    schema: {
      example: {
        success: false,
        message: 'You can only review parcels you received',
        errorCode: 'REVIEW_FORBIDDEN',
        statusCode: 403,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
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
  async create(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.create(req.user, createReviewDto);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(
    @Request() req: { user: { id?: string; sub?: string; role?: string } },
  ) {
    const reviews = await this.reviewsService.findByUser(req.user);
    return { data: reviews };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all reviews for current user',
    description: `
      Retrieve all reviews created by the authenticated user.
      Requires valid JWT authentication.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User reviews retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User reviews retrieved successfully',
        data: [
          {
            id: 'clx123456789',
            parcelId: 'clx987654321',
            rating: 5,
            comment: 'Excellent service! Package delivered on time.',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
            user: {
              id: 'clx111222333',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              role: 'USER',
            },
            parcel: {
              id: 'clx987654321',
              trackingNumber: 'TRK001234567',
              description: 'Electronics package',
              status: 'DELIVERED',
            },
          },
        ],
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async findMyReviews(
    @Request() req: { user: { id?: string; sub?: string; role?: string } },
  ): Promise<any> {
    const reviews = await this.reviewsService.findByUser(req.user);
    return { data: reviews };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all reviews (admin only)',
    description: `
      Administrative endpoint to retrieve all reviews in the system.
      Only accessible by users with ADMIN role.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Reviews retrieved successfully',
        data: [
          {
            id: 'clx123456789',
            parcelId: 'clx987654321',
            rating: 5,
            comment: 'Excellent service! Package delivered on time.',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
            user: {
              id: 'clx111222333',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              role: 'USER',
            },
            parcel: {
              id: 'clx987654321',
              trackingNumber: 'TRK001234567',
              description: 'Electronics package',
              status: 'DELIVERED',
            },
          },
        ],
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid JWT token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
        errorCode: 'AUTH_UNAUTHORIZED',
        statusCode: 401,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions - Admin access required',
    schema: {
      example: {
        success: false,
        message: 'Admin access required',
        errorCode: 'ACCESS_DENIED',
        statusCode: 403,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async findAllAdmin(
    @Request() req: { user?: { id?: string; role?: string } },
  ): Promise<ReviewResponseDto[]> {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new BadRequestException('Admin access required');
    }
    return this.reviewsService.findAll(true);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User reviews retrieved successfully',
    type: [ReviewResponseDto],
  })
  async findByUser(@Param('userId') userId: string): Promise<any> {
    const reviews = await this.reviewsService.findByUser(userId);
    return { data: reviews };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get review statistics (average rating and total count)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        averageRating: { type: 'number' },
        totalReviews: { type: 'number' },
      },
    },
  })
  async getStats(): Promise<{ averageRating: number; totalReviews: number }> {
    return this.reviewsService.getAverageRating();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a specific review by ID (owner or admin only)',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review retrieved successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async getReviewById(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string; role?: string } },
  ) {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';
    const review = await this.reviewsService.findOne(id, userId, isAdmin);
    return { data: review };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review (only by review owner)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review updated successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - You can only update your own reviews',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async update(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string; sub?: string; role?: string } },
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const user = req.user;
    const userId =
      typeof user?.sub === 'string'
        ? user.sub
        : typeof user?.id === 'string'
          ? user.id
          : undefined;
    if (!userId) throw new BadRequestException('Invalid user');
    return this.reviewsService.update(id, userId, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (only by review owner)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - You can only delete your own reviews',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string; sub?: string; role?: string } },
  ): Promise<void> {
    // Extract userId from req.user
    const user = req.user;
    const userId =
      typeof user?.sub === 'string'
        ? user.sub
        : typeof user?.id === 'string'
          ? user.id
          : undefined;
    if (!userId) throw new BadRequestException('Invalid user');
    return this.reviewsService.remove(id, userId);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete any review (admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  async removeAdmin(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string; sub?: string; role?: string } },
  ): Promise<void> {
    // Extract userId from req.user
    const user = req.user;
    const userId =
      typeof user?.sub === 'string'
        ? user.sub
        : typeof user?.id === 'string'
          ? user.id
          : undefined;
    if (!userId) throw new BadRequestException('Invalid user');
    return this.reviewsService.remove(id, userId, true);
  }
}
