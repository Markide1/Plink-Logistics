import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum ReportType {
  USERS = 'users',
  PARCELS = 'parcels',
  EARNINGS = 'earnings',
  STATISTICS = 'statistics',
}

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
}

export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the report period',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the report period',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class UserReportDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'New users in period' })
  newUsers: number;

  @ApiProperty({ description: 'Active users in period' })
  activeUsers: number;

  @ApiProperty({ description: 'User details' })
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    createdAt: Date;
    lastLogin?: Date;
    totalParcels: number;
    totalSpent: number;
  }[];
}

export class ParcelReportDto {
  @ApiProperty({ description: 'Total number of parcels' })
  totalParcels: number;

  @ApiProperty({ description: 'Parcels created in period' })
  newParcels: number;

  @ApiProperty({ description: 'Delivered parcels in period' })
  deliveredParcels: number;

  @ApiProperty({ description: 'Cancelled parcels in period' })
  cancelledParcels: number;

  @ApiProperty({ description: 'Parcels by status' })
  parcelsByStatus: {
    status: string;
    count: number;
  }[];

  @ApiProperty({ description: 'Parcel details' })
  parcels: {
    id: string;
    trackingNumber: string;
    weight: number;
    price: number;
    status: string;
    createdAt: Date;
    deliveredAt?: Date;
    sender: {
      firstName: string;
      lastName: string;
      email: string;
    };
    receiver: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  }[];
}

export class EarningsReportDto {
  @ApiProperty({ description: 'Total earnings' })
  totalEarnings: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Earnings in period' })
  periodEarnings: number;

  @ApiProperty({ description: 'Number of completed payments' })
  completedPayments: number;

  @ApiProperty({ description: 'Number of pending payments' })
  pendingPayments: number;

  @ApiProperty({ description: 'Average payment amount' })
  averagePayment: number;

  @ApiProperty({ description: 'Earnings by month' })
  monthlyEarnings: {
    month: string;
    earnings: number;
    transactions: number;
  }[];

  @ApiProperty({ description: 'Top paying customers' })
  topCustomers: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    totalSpent: number;
    totalParcels: number;
  }[];
}

export class StatisticsReportDto {
  @ApiProperty({ description: 'System overview statistics' })
  overview: {
    totalUsers: number;
    totalParcels: number;
    totalEarnings: number;
    totalReviews: number;
  };

  @ApiProperty({ description: 'Growth metrics' })
  growth: {
    usersGrowth: number; // percentage
    parcelsGrowth: number; // percentage
    earningsGrowth: number; // percentage
  };

  @ApiProperty({ description: 'Performance metrics' })
  performance: {
    averageDeliveryTime: number; // in days
    deliverySuccessRate: number; // percentage
    customerSatisfactionRate: number; // average review rating
  };

  @ApiProperty({ description: 'Recent activity' })
  recentActivity: {
    recentUsers: number; // last 30 days
    recentParcels: number; // last 30 days
    recentReviews: number; // last 30 days
  };
}
