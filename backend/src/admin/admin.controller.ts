import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { USER_ROLES } from '../common/constants';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
    description: 'Retrieve comprehensive dashboard statistics for admin users',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          totalParcels: 150,
          pendingParcels: 25,
          inTransitParcels: 45,
          deliveredParcels: 80,
          totalRevenue: 12500.5,
          recentParcels: [],
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('reviews')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Get all reviews for admin management',
    description: 'Retrieve paginated list of all reviews for admin management',
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
  })
  async getAllReviews() {
    return this.adminService.getAllReviews();
  }

  @Get('reviews/stats')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Get review statistics',
    description: 'Retrieve comprehensive review statistics for admin dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Review statistics retrieved successfully',
  })
  async getReviewStats() {
    return this.adminService.getReviewStats();
  }

  @Get('reports')
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: 'Get admin reports data',
    description:
      'Retrieve report data for admin dashboard with filtering options',
  })
  @ApiResponse({
    status: 200,
    description: 'Report data retrieved successfully',
  })
  async getReportsData(@Query() query: any) {
    return this.adminService.getReportsData(query);
  }
}
