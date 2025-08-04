import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommonHelpers } from '../common/helpers';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getDashboardStats() {
    try {
      const [
        totalParcels,
        pendingParcels,
        inTransitParcels,
        deliveredParcels,
        recentParcels,
        totalUsers,
      ] = await Promise.all([
        // Total parcels
        this.prismaService.parcel.count({
          where: { isDeleted: false },
        }),
        // Pending parcels
        this.prismaService.parcel.count({
          where: { status: 'PENDING', isDeleted: false },
        }),
        // In transit parcels
        this.prismaService.parcel.count({
          where: { status: 'IN_TRANSIT', isDeleted: false },
        }),
        // Delivered parcels
        this.prismaService.parcel.count({
          where: { status: 'DELIVERED', isDeleted: false },
        }),
        // Recent parcels (last 10)
        this.prismaService.parcel.findMany({
          where: { isDeleted: false },
          take: 10,
          orderBy: { createdAt: 'desc' },
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
        }),
        // Total users
        this.prismaService.user.count({
          where: { isDeleted: false },
        }),
      ]);

      const dashboardData = {
        totalParcels,
        pendingParcels,
        inTransitParcels,
        deliveredParcels,
        activeDelivery: inTransitParcels,
        totalRevenue:
          (
            await this.prismaService.parcel.aggregate({
              where: { isDeleted: false },
              _sum: { price: true },
            })
          )._sum.price || 0,
        recentParcels,
        users: totalUsers,
      };

      return CommonHelpers.createResponse(
        true,
        'Dashboard statistics retrieved successfully',
        dashboardData,
      );
    } catch (error) {
      this.logger.error('Failed to fetch dashboard statistics:', error);
      throw error;
    }
  }

  async getAllReviews() {
    try {
      const reviews = await this.prismaService.review.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          parcel: {
            select: {
              id: true,
              trackingNumber: true,
              description: true,
              status: true,
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
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Map to frontend format
      const mappedReviews = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.content,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        parcel: {
          id: review.parcel.id,
          trackingNumber: review.parcel.trackingNumber,
          description: review.parcel.description,
          status: review.parcel.status,
          sender: {
            id: review.parcel.sender.id,
            name: `${review.parcel.sender.firstName} ${review.parcel.sender.lastName}`,
            email: review.parcel.sender.email,
          },
          receiver: {
            id: review.parcel.receiver.id,
            name: `${review.parcel.receiver.firstName} ${review.parcel.receiver.lastName}`,
            email: review.parcel.receiver.email,
          },
        },
        reviewer: {
          id: review.user.id,
          name: `${review.user.firstName} ${review.user.lastName}`,
          email: review.user.email,
        },
      }));

      return CommonHelpers.createResponse(
        true,
        'Reviews retrieved successfully',
        mappedReviews,
      );
    } catch (error) {
      this.logger.error('Failed to fetch reviews:', error);
      throw error;
    }
  }

  async getReviewStats() {
    try {
      const [totalReviews, averageRating, ratingDistribution] =
        await Promise.all([
          // Total reviews count
          this.prismaService.review.count(),
          // Average rating
          this.prismaService.review.aggregate({
            _avg: { rating: true },
          }),
          // Rating distribution
          this.prismaService.review.groupBy({
            by: ['rating'],
            _count: { rating: true },
          }),
        ]);

      const stats = {
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution: ratingDistribution.map((item) => ({
          rating: item.rating,
          count: item._count.rating,
        })),
      };

      return CommonHelpers.createResponse(
        true,
        'Review statistics retrieved successfully',
        stats,
      );
    } catch (error) {
      this.logger.error('Failed to fetch review statistics:', error);
      throw error;
    }
  }

  async getReportsData(query: {
    dateFrom?: string;
    dateTo?: string;
    reportType?: string;
  }) {
    try {
      const { dateFrom, dateTo, reportType = 'OVERVIEW' } = query;

      // Create date filters
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) {
        dateFilter.gte = new Date(String(dateFrom));
      }
      if (dateTo) {
        dateFilter.lte = new Date(String(dateTo));
      }

      const whereClause = {
        isDeleted: false,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      };

      const [
        totalParcels,
        parcelsByStatus,
        parcelsByDate,
        totalRevenue,
        totalUsers,
      ] = await Promise.all([
        // Total parcels in date range
        this.prismaService.parcel.count({ where: whereClause }),

        // Parcels grouped by status
        this.prismaService.parcel.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true },
        }),

        // Parcels by date for chart
        this.prismaService.parcel.findMany({
          where: whereClause,
          select: {
            createdAt: true,
            price: true,
          },
          orderBy: { createdAt: 'asc' },
        }),

        // Total revenue
        this.prismaService.parcel.aggregate({
          where: { ...whereClause, status: 'DELIVERED' },
          _sum: { price: true },
        }),

        // Total users
        this.prismaService.user.count({
          where: {
            isDeleted: false,
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter,
            }),
          },
        }),
      ]);

      // Process data for frontend consumption
      const reportData = {
        overview: {
          totalParcels,
          totalRevenue: totalRevenue._sum.price || 0,
          totalUsers,
        },
        parcelsByStatus: parcelsByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        parcelsByDate: this.processDateData(parcelsByDate),
        summary: {
          period: `${dateFrom || 'Beginning'} - ${dateTo || 'Now'}`,
          reportType,
        },
      };

      return CommonHelpers.createResponse(
        true,
        'Report data retrieved successfully',
        reportData,
      );
    } catch (error) {
      this.logger.error('Failed to fetch report data:', error);
      throw error;
    }
  }

  private processDateData(parcels: Array<{ createdAt: Date; price: number }>) {
    // Group parcels by date
    const dateMap = new Map<string, { count: number; revenue: number }>();

    parcels.forEach((parcel) => {
      const date = parcel.createdAt.toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { count: 0, revenue: 0 });
      }
      const existing = dateMap.get(date)!;
      existing.count += 1;
      existing.revenue += parcel.price || 0;
    });

    // Convert to array format
    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));
  }
}
