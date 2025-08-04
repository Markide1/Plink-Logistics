/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExportFormat,
  ParcelReportDto,
  ReportQueryDto,
  UserReportDto,
  EarningsReportDto,
  StatisticsReportDto,
} from './dto/reports.dto';

const PDFDocument = require('pdfkit');
import {
  writeUsersReportToPDF,
  writeParcelsReportToPDF,
  writeEarningsReportToPDF,
  writeStatisticsReportToPDF,
} from './pdf-writers';
import { Prisma, Parcel, Review } from '@prisma/client';
import { PassThrough } from 'stream';

type UserWithPartialParcelInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: Date;
  totalParcels: number;
  totalSpent: number;
};

type ParcelWithSenderAndReceiver = Parcel & {
  sender: { firstName: string; lastName: string; email: string };
  receiver: { firstName: string; lastName: string; phone: string | null };
};

type ParcelDetails = {
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
};

type MonthlyEarnings = {
  month: string;
  earnings: number;
  transactions: number;
};

type TopCustomer = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalSpent: number;
  totalParcels: number;
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getUsersReport(query: ReportQueryDto): Promise<UserReportDto> {
    const { startDate, endDate } = query;
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const whereClause: Prisma.UserWhereInput = { isDeleted: false };
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalUsers = await this.prisma.user.count({
      where: { isDeleted: false },
    });
    const newUsers = users.length;
    const activeUsers = users.length;

    // Calculate totalParcels and totalSpent per user
    const userStats: UserWithPartialParcelInfo[] = await Promise.all(
      users.map(async (u) => {
        const totalParcels = await this.prisma.parcel.count({
          where: { senderId: u.id, isDeleted: false },
        });
        const totalSpentResult = await this.prisma.parcel.aggregate({
          where: { senderId: u.id, isDeleted: false },
          _sum: { price: true },
        });
        return {
          ...u,
          phone: u.phone ?? undefined,
          totalParcels,
          totalSpent: totalSpentResult._sum.price || 0,
        };
      }),
    );

    return {
      totalUsers,
      newUsers,
      activeUsers,
      users: userStats,
    };
  }

  async getParcelsReport(query: ReportQueryDto): Promise<ParcelReportDto> {
    const { startDate, endDate } = query;
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const whereClause: Prisma.ParcelWhereInput = { isDeleted: false };
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    const parcels: ParcelWithSenderAndReceiver[] =
      await this.prisma.parcel.findMany({
        where: whereClause,
        include: {
          sender: { select: { firstName: true, lastName: true, email: true } },
          receiver: {
            select: { firstName: true, lastName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

    const totalParcels = await this.prisma.parcel.count({
      where: { isDeleted: false },
    });
    const newParcels = parcels.length;
    const deliveredParcels = parcels.filter(
      (p) => p.status === 'DELIVERED',
    ).length;
    const cancelledParcels = parcels.filter(
      (p) => p.status === 'CANCELLED',
    ).length;

    // Status breakdown
    const parcelsByStatusRaw = await this.prisma.parcel.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: { status: true },
    });
    const parcelsByStatus = parcelsByStatusRaw.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    return {
      totalParcels,
      newParcels,
      deliveredParcels,
      cancelledParcels,
      parcelsByStatus,
      parcels: parcels.map((p): ParcelDetails => {
        const deliveredAt = p.status === 'DELIVERED' ? p.updatedAt : undefined;
        return {
          id: p.id,
          trackingNumber: p.trackingNumber,
          weight: p.weight,
          price: p.price,
          status: p.status,
          createdAt: p.createdAt,
          deliveredAt: deliveredAt,
          sender: {
            firstName: p.sender.firstName,
            lastName: p.sender.lastName,
            email: p.sender.email,
          },
          receiver: {
            firstName: p.receiver.firstName,
            lastName: p.receiver.lastName,
            phone: p.receiver.phone ?? '',
          },
        };
      }),
    };
  }

  async getEarningsReport(query: ReportQueryDto): Promise<EarningsReportDto> {
    const { startDate, endDate } = query;
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const whereClause: Prisma.ParcelWhereInput = { isDeleted: false };
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    // Total earnings (sum of all parcel prices)
    const totalEarningsResult = await this.prisma.parcel.aggregate({
      where: { isDeleted: false },
      _sum: { price: true },
    });
    const totalEarnings = totalEarningsResult._sum.price || 0;

    // Total revenue (sum of delivered parcel prices)
    const totalRevenueResult = await this.prisma.parcel.aggregate({
      where: { status: 'DELIVERED', isDeleted: false },
      _sum: { price: true },
    });
    const totalRevenue = totalRevenueResult._sum.price || 0;

    // Earnings in period
    const periodEarningsResult = await this.prisma.parcel.aggregate({
      where: { ...whereClause, status: 'DELIVERED' },
      _sum: { price: true },
    });
    const periodEarnings = periodEarningsResult._sum.price || 0;

    // Payments
    const completedPayments = await this.prisma.payment.count({
      where: { status: 'COMPLETED' },
    });
    const pendingPayments = await this.prisma.payment.count({
      where: { status: 'PENDING' },
    });

    // Average payment
    const avgPaymentResult = await this.prisma.payment.aggregate({
      _avg: { amount: true },
    });
    const averagePayment = avgPaymentResult._avg.amount || 0;

    // Monthly earnings
    const monthlyEarningsRaw = await this.prisma.payment.groupBy({
      by: ['processedAt'],
      _sum: { amount: true },
      _count: { id: true },
    });
    const monthlyEarnings: MonthlyEarnings[] = monthlyEarningsRaw.map((m) => ({
      month: m.processedAt ? m.processedAt.toISOString().slice(0, 7) : '',
      earnings: m._sum.amount || 0,
      transactions: m._count.id,
    }));

    // Top customers: get users and their sent parcels
    const topCustomersRaw = await this.prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // For each user, count parcels and sum price
    const topCustomers: TopCustomer[] = await Promise.all(
      topCustomersRaw.map(async (u) => {
        const parcels = await this.prisma.parcel.findMany({
          where: { senderId: u.id, isDeleted: false },
          select: { price: true },
        });
        return {
          userId: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          totalSpent: parcels.reduce((sum, p) => sum + (p.price || 0), 0),
          totalParcels: parcels.length,
        };
      }),
    );
    topCustomers.sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      totalEarnings,
      totalRevenue,
      periodEarnings,
      completedPayments,
      pendingPayments,
      averagePayment,
      monthlyEarnings,
      topCustomers: topCustomers.slice(0, 5),
    };
  }

  async getStatisticsReport(): Promise<StatisticsReportDto> {
    // Overview
    const totalUsers = await this.prisma.user.count({
      where: { isDeleted: false },
    });
    const totalParcels = await this.prisma.parcel.count({
      where: { isDeleted: false },
    });
    const totalEarningsResult = await this.prisma.parcel.aggregate({
      where: { isDeleted: false },
      _sum: { price: true },
    });
    const totalEarnings = totalEarningsResult._sum.price || 0;
    const totalReviews = await this.prisma.review.count();

    // Growth metrics
    // Users growth: % increase in users in last 30 days vs previous 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const usersLast30 = await this.prisma.user.count({
      where: {
        isDeleted: false,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const usersPrev30 = await this.prisma.user.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });
    const usersGrowth =
      usersPrev30 === 0 ? 0 : ((usersLast30 - usersPrev30) / usersPrev30) * 100;

    // Parcels growth: % increase in parcels in last 30 days vs previous 30 days
    const parcelsLast30 = await this.prisma.parcel.count({
      where: {
        isDeleted: false,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const parcelsPrev30 = await this.prisma.parcel.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });
    const parcelsGrowth =
      parcelsPrev30 === 0
        ? 0
        : ((parcelsLast30 - parcelsPrev30) / parcelsPrev30) * 100;

    // Earnings growth: % increase in delivered parcel price sum in last 30 days vs previous 30 days
    const earningsLast30Result = await this.prisma.parcel.aggregate({
      where: {
        isDeleted: false,
        status: 'DELIVERED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { price: true },
    });
    const earningsPrev30Result = await this.prisma.parcel.aggregate({
      where: {
        isDeleted: false,
        status: 'DELIVERED',
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      _sum: { price: true },
    });
    const earningsLast30 = earningsLast30Result._sum.price || 0;
    const earningsPrev30 = earningsPrev30Result._sum.price || 0;
    const earningsGrowth =
      earningsPrev30 === 0
        ? 0
        : ((earningsLast30 - earningsPrev30) / earningsPrev30) * 100;

    // Performance metrics
    // Average delivery time (in days) for delivered parcels in last 30 days
    const deliveredParcels: Pick<Parcel, 'createdAt' | 'updatedAt'>[] =
      await this.prisma.parcel.findMany({
        where: {
          isDeleted: false,
          status: 'DELIVERED',
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, updatedAt: true },
      });
    const averageDeliveryTime =
      deliveredParcels.length === 0
        ? 0
        : deliveredParcels.reduce(
            (sum, p) =>
              sum +
              (p.updatedAt.getTime() - p.createdAt.getTime()) /
                (1000 * 60 * 60 * 24),
            0,
          ) / deliveredParcels.length;

    // Delivery success rate: % of delivered parcels out of all parcels in last 30 days
    const totalParcelsLast30 = await this.prisma.parcel.count({
      where: {
        isDeleted: false,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const deliveredParcelsLast30 = deliveredParcels.length;
    const deliverySuccessRate =
      totalParcelsLast30 === 0
        ? 0
        : (deliveredParcelsLast30 / totalParcelsLast30) * 100;

    // Customer satisfaction rate: average rating from reviews in last 30 days
    const reviewsLast30: Pick<Review, 'rating'>[] =
      await this.prisma.review.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { rating: true },
      });
    const customerSatisfactionRate =
      reviewsLast30.length === 0
        ? 0
        : reviewsLast30.reduce((sum, r) => sum + r.rating, 0) /
          reviewsLast30.length;

    // Recent activity (last 30 days)
    const recentUsers = await this.prisma.user.count({
      where: {
        isDeleted: false,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const recentParcels = await this.prisma.parcel.count({
      where: {
        isDeleted: false,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const recentReviews = await this.prisma.review.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      overview: {
        totalUsers,
        totalParcels,
        totalEarnings,
        totalReviews,
      },
      growth: {
        usersGrowth,
        parcelsGrowth,
        earningsGrowth,
      },
      performance: {
        averageDeliveryTime,
        deliverySuccessRate,
        customerSatisfactionRate,
      },
      recentActivity: {
        recentUsers,
        recentParcels,
        recentReviews,
      },
    };
  }

  async getFullReport(query: ReportQueryDto): Promise<{
    users: UserReportDto;
    parcels: ParcelReportDto;
    earnings: EarningsReportDto;
    statistics: StatisticsReportDto;
  }> {
    const [users, parcels, earnings, statistics] = await Promise.all([
      this.getUsersReport(query),
      this.getParcelsReport(query),
      this.getEarningsReport(query),
      this.getStatisticsReport(),
    ]);
    return { users, parcels, earnings, statistics };
  }

  // Type guards for report data
  private isUserReport(data: unknown): data is UserReportDto {
    return (
      typeof data === 'object' &&
      data !== null &&
      'totalUsers' in data &&
      typeof (data as UserReportDto).totalUsers === 'number' &&
      'users' in data &&
      Array.isArray((data as UserReportDto).users)
    );
  }
  private isParcelReport(data: unknown): data is ParcelReportDto {
    return (
      typeof data === 'object' &&
      data !== null &&
      'totalParcels' in data &&
      typeof (data as ParcelReportDto).totalParcels === 'number' &&
      'parcels' in data &&
      Array.isArray((data as ParcelReportDto).parcels)
    );
  }
  private isEarningsReport(data: unknown): data is EarningsReportDto {
    return (
      typeof data === 'object' &&
      data !== null &&
      'totalEarnings' in data &&
      typeof (data as EarningsReportDto).totalEarnings === 'number' &&
      'topCustomers' in data &&
      Array.isArray((data as EarningsReportDto).topCustomers)
    );
  }
  private isStatisticsReport(data: unknown): data is StatisticsReportDto {
    return (
      typeof data === 'object' &&
      data !== null &&
      'overview' in data &&
      typeof (data as StatisticsReportDto).overview === 'object' &&
      'growth' in data &&
      typeof (data as StatisticsReportDto).growth === 'object'
    );
  }

  async exportReport(
    reportType: string,
    format: ExportFormat,
    query: ReportQueryDto,
  ): Promise<Buffer> {
    let reportData:
      | UserReportDto
      | ParcelReportDto
      | EarningsReportDto
      | StatisticsReportDto
      | {
          users: UserReportDto;
          parcels: ParcelReportDto;
          earnings: EarningsReportDto;
          statistics: StatisticsReportDto;
        };

    // Handle 'full' report type
    if (reportType === 'full') {
      reportData = await this.getFullReport(query);
    } else {
      switch (reportType) {
        case 'users':
          reportData = await this.getUsersReport(query);
          break;
        case 'parcels':
          reportData = await this.getParcelsReport(query);
          break;
        case 'earnings':
          reportData = await this.getEarningsReport(query);
          break;
        case 'statistics':
          reportData = await this.getStatisticsReport();
          break;
        default:
          throw new Error('Invalid report type');
      }
    }

    if (format === ExportFormat.JSON) {
      return Buffer.from(JSON.stringify(reportData, null, 2));
    } else if (format === ExportFormat.CSV) {
      // CSV export for full report: concatenate all sections
      if (
        reportType === 'full' &&
        typeof reportData === 'object' &&
        'users' in reportData &&
        'parcels' in reportData &&
        'earnings' in reportData &&
        'statistics' in reportData
      ) {
        const fullData = reportData as {
          users: UserReportDto;
          parcels: ParcelReportDto;
          earnings: EarningsReportDto;
          statistics: StatisticsReportDto;
        };
        const toCSV = <T extends object>(
          data: T[] | T,
          sectionName?: string,
        ): string => {
          if (Array.isArray(data)) {
            if (data.length === 0) return '';
            const keys = Object.keys(data[0] as Record<string, unknown>);
            const rows = data.map((row) =>
              keys
                .map((k) => {
                  const value = (row as Record<string, unknown>)[k];
                  if (value === null || value === undefined) return '""';
                  if (typeof value === 'object')
                    return `"${JSON.stringify(value)}"`;
                  return typeof value === 'object'
                    ? `"${JSON.stringify(value)}"`
                    : `"${JSON.stringify(value)}"`;
                })
                .join(','),
            );
            return (
              (sectionName ? `\n=== ${sectionName} ===\n` : '') +
              [keys.join(','), ...rows].join('\n')
            );
          } else if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data as Record<string, unknown>);
            const values = keys.map((k) => {
              const value = data[k as keyof T];
              if (value === null || value === undefined) return '""';
              if (typeof value === 'object')
                return `"${JSON.stringify(value)}"`;
              return typeof value === 'object' && value !== null
                ? `"${JSON.stringify(value)}"`
                : typeof value === 'object' && value !== null
                  ? `"${JSON.stringify(value)}"`
                  : typeof value === 'object' && value !== null
                    ? `"${JSON.stringify(value)}"`
                    : `"${String(value)}"`;
            });
            return (
              (sectionName ? `\n=== ${sectionName} ===\n` : '') +
              [keys.join(','), values.join(',')].join('\n')
            );
          }
          return '';
        };
        let csvData = '';
        csvData += toCSV(fullData.users.users, 'Users');
        csvData += toCSV(fullData.parcels.parcels, 'Parcels');
        csvData += toCSV(fullData.earnings.topCustomers, 'Top Customers');
        csvData += toCSV(fullData.statistics.overview, 'Statistics Overview');
        return Buffer.from(csvData);
      }

      // CSV export for single report types
      const toCSV = <T extends object>(data: T[] | T): string => {
        if (Array.isArray(data)) {
          if (data.length === 0) return '';
          const keys = Object.keys(data[0] as Record<string, unknown>);
          const rows = data.map((row) =>
            keys
              .map((k) => {
                const value = (row as Record<string, unknown>)[k];
                if (value === null || value === undefined) return '""';
                if (typeof value === 'object')
                  return `"${JSON.stringify(value)}"`;
                return `"${String(value)}"`;
              })
              .join(','),
          );
          return [keys.join(','), ...rows].join('\n');
        } else if (typeof data === 'object' && data !== null) {
          const keys = Object.keys(data as Record<string, unknown>);
          const values = keys.map((k) => {
            const value = data[k as keyof T];
            if (value === null || value === undefined) return '""';
            if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
            return `"${String(value)}"`;
          });
          return [keys.join(','), values.join(',')].join('\n');
        }
        return '';
      };
      let csvData = '';
      if (reportType === 'users' && this.isUserReport(reportData)) {
        csvData = toCSV(reportData.users);
      } else if (reportType === 'parcels' && this.isParcelReport(reportData)) {
        csvData = toCSV(reportData.parcels);
      } else if (
        reportType === 'earnings' &&
        this.isEarningsReport(reportData)
      ) {
        csvData = toCSV(reportData.topCustomers);
      } else if (
        reportType === 'statistics' &&
        this.isStatisticsReport(reportData)
      ) {
        csvData = toCSV(reportData.overview);
      } else {
        csvData = toCSV(reportData);
      }
      return Buffer.from(csvData);
    } else if (format === ExportFormat.PDF) {
      try {
        const doc = new PDFDocument();
        const stream = new PassThrough();
        doc.pipe(stream);

        if (reportType === 'users' && this.isUserReport(reportData)) {
          writeUsersReportToPDF(doc, reportData);
        } else if (
          reportType === 'parcels' &&
          this.isParcelReport(reportData)
        ) {
          writeParcelsReportToPDF(doc, reportData);
        } else if (
          reportType === 'earnings' &&
          this.isEarningsReport(reportData)
        ) {
          writeEarningsReportToPDF(doc, reportData);
        } else if (
          reportType === 'statistics' &&
          this.isStatisticsReport(reportData)
        ) {
          writeStatisticsReportToPDF(doc, reportData);
        } else if (reportType === 'full') {
          if (
            typeof reportData === 'object' &&
            reportData !== null &&
            'users' in reportData &&
            'parcels' in reportData &&
            'earnings' in reportData &&
            'statistics' in reportData
          ) {
            writeUsersReportToPDF(doc, reportData.users);
            writeParcelsReportToPDF(doc, reportData.parcels);
            writeEarningsReportToPDF(doc, reportData.earnings);
            writeStatisticsReportToPDF(doc, reportData.statistics);
          }
        }

        doc.end();
        return new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', (err) => reject(err));
        });
      } catch (err) {
        // Add error logging here
        console.error('PDF export error:', err);
        throw err;
      }
    }
    throw new Error('Invalid export format');
  }
}
