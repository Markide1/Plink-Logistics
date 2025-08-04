import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ReportQueryDto,
  ReportType,
  ExportFormat,
  UserReportDto,
  ParcelReportDto,
  EarningsReportDto,
  StatisticsReportDto,
} from './dto/reports.dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get user statistics report' })
  @ApiResponse({
    status: 200,
    description: 'User report generated successfully',
    type: UserReportDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO format)',
  })
  async getUserReport(@Query() query: ReportQueryDto): Promise<UserReportDto> {
    return this.reportsService.getUsersReport(query);
  }

  @Get('parcels')
  @ApiOperation({ summary: 'Get parcel statistics report' })
  @ApiResponse({
    status: 200,
    description: 'Parcel report generated successfully',
    type: ParcelReportDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO format)',
  })
  async getParcelReport(
    @Query() query: ReportQueryDto,
  ): Promise<ParcelReportDto> {
    return this.reportsService.getParcelsReport(query);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get earnings and revenue report' })
  @ApiResponse({
    status: 200,
    description: 'Earnings report generated successfully',
    type: EarningsReportDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO format)',
  })
  async getEarningsReport(
    @Query() query: ReportQueryDto,
  ): Promise<EarningsReportDto> {
    return this.reportsService.getEarningsReport(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get comprehensive system statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics report generated successfully',
    type: StatisticsReportDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO format)',
  })
  async getStatisticsReport(): Promise<StatisticsReportDto> {
    return this.reportsService.getStatisticsReport();
  }

  @Get('export')
  @ApiOperation({
    summary:
      'Export reports in CSV or PDF format (users, parcels, earnings, statistics, or full)',
  })
  @ApiResponse({
    status: 200,
    description: 'Report exported successfully',
  })
  @ApiQuery({
    name: 'reportType',
    required: true,
    enum: [...Object.values(ReportType), 'full'],
    description:
      'Type of report to export (users, parcels, earnings, statistics, full)',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ExportFormat,
    description: 'Export format (CSV or PDF)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO format)',
  })
  async exportReport(
    @Query('reportType') reportType: string,
    @Query('format') format: ExportFormat,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await this.reportsService.exportReport(
        reportType,
        format,
        query,
      );
      // Set appropriate headers based on format
      if (format === ExportFormat.CSV) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${reportType}-report.csv"`,
        );
      } else if (format === ExportFormat.PDF) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${reportType}-report.pdf"`,
        );
      }
      res.status(HttpStatus.OK).send(result);
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to export report',
        error: errorMessage,
      });
    }
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get quick summary of key metrics' })
  @ApiResponse({
    status: 200,
    description: 'Summary statistics retrieved successfully',
  })
  async getSummary(): Promise<{
    totalUsers: number;
    totalParcels: number;
    totalRevenue: number;
    pendingParcels: number;
    deliveredParcels: number;
    activeUsers: number;
  }> {
    const [userReport, parcelReport, earningsReport] = await Promise.all([
      this.reportsService.getUsersReport({}),
      this.reportsService.getParcelsReport({}),
      this.reportsService.getEarningsReport({}),
    ]);

    return {
      totalUsers: userReport.totalUsers,
      totalParcels: parcelReport.totalParcels,
      totalRevenue: earningsReport.totalRevenue,
      pendingParcels:
        parcelReport.parcelsByStatus.find((s) => s.status === 'PENDING')
          ?.count || 0,
      deliveredParcels:
        parcelReport.parcelsByStatus.find((s) => s.status === 'DELIVERED')
          ?.count || 0,
      activeUsers: userReport.activeUsers,
    };
  }
}
