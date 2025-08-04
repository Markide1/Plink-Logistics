export interface ReportData {
  usersReport?: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    users: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      role: string;
      createdAt: Date;
      totalParcels: number;
      totalSpent: number;
    }>;
  };
  parcelsReport?: {
    totalParcels: number;
    newParcels: number;
    deliveredParcels: number;
    cancelledParcels: number;
    parcelsByStatus: Array<{ status: string; count: number; percentage?: number }>;
    parcels: Array<{
      id: string;
      trackingNumber: string;
      weight: number;
      price: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      sender: { firstName: string; lastName: string; email: string };
      receiver: { firstName: string; lastName: string; phone: string };
      deliveredAt?: Date;
    }>;
  };
  earningsReport?: {
    totalEarnings: number;
    totalRevenue: number;
    periodEarnings: number;
    completedPayments: number;
    pendingPayments: number;
    averagePayment: number;
    monthlyEarnings: Array<{ month: string; earnings: number; transactions: number }>;
    topCustomers: Array<{
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      totalSpent: number;
      totalParcels: number;
    }>;
  };
  statisticsReport?: {
    overview: {
      totalUsers: number;
      totalParcels: number;
      totalEarnings: number;
      totalReviews: number;
    };
    growth: {
      usersGrowth: number;
      parcelsGrowth: number;
      earningsGrowth: number;
    };
    performance: {
      averageDeliveryTime: number;
      deliverySuccessRate: number;
      customerSatisfactionRate: number;
    };
    recentActivity: {
      recentUsers: number;
      recentParcels: number;
      recentReviews: number;
    };
  };
}
