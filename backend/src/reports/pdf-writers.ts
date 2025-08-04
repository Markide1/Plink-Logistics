
import {
  UserReportDto,
  ParcelReportDto,
  EarningsReportDto,
  StatisticsReportDto,
} from './dto/reports.dto';

const PDFDocument = require('pdfkit');

export function writeUsersReportToPDF(
  doc: InstanceType<typeof PDFDocument>,
  report: UserReportDto,
) {
  doc.fontSize(16).text('Users Report', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Total Users: ${report.totalUsers}`);
  doc.text(`New Users: ${report.newUsers}`);
  doc.text(`Active Users: ${report.activeUsers}`);
  doc.moveDown();
  doc.fontSize(14).text('User Details:', { underline: true });
  doc.moveDown(0.5);
  report.users.forEach((user, idx) => {
    doc
      .fontSize(12)
      .text(
        `${idx + 1}. ${user.firstName} ${user.lastName} | Email: ${user.email} | Phone: ${user.phone ?? '-'} | Role: ${user.role} | Created: ${user.createdAt instanceof Date ? user.createdAt.toISOString().split('T')[0] : user.createdAt} | Parcels: ${user.totalParcels} | Spent: KES ${user.totalSpent}`,
      );
  });
  doc.moveDown();
}

export function writeParcelsReportToPDF(
  doc: InstanceType<typeof PDFDocument>,
  report: ParcelReportDto,
) {
  doc.fontSize(16).text('Parcels Report', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Total Parcels: ${report.totalParcels}`);
  doc.text(`New Parcels: ${report.newParcels}`);
  doc.text(`Delivered Parcels: ${report.deliveredParcels}`);
  doc.text(`Cancelled Parcels: ${report.cancelledParcels}`);
  doc.moveDown();
  doc.fontSize(14).text('Status Breakdown:', { underline: true });
  report.parcelsByStatus.forEach((status) => {
    doc.fontSize(12).text(`${status.status}: ${status.count}`);
  });
  doc.moveDown();
  doc.fontSize(14).text('Parcel Details:', { underline: true });
  report.parcels.forEach((parcel, idx) => {
    doc
      .fontSize(12)
      .text(
        `${idx + 1}. Tracking: ${parcel.trackingNumber} | Weight: ${parcel.weight}kg | Price: KES ${parcel.price} | Status: ${parcel.status} | Created: ${parcel.createdAt instanceof Date ? parcel.createdAt.toISOString().split('T')[0] : parcel.createdAt} | Sender: ${parcel.sender.firstName} ${parcel.sender.lastName} | Receiver: ${parcel.receiver.firstName} ${parcel.receiver.lastName}`,
      );
  });
  doc.moveDown();
}

export function writeEarningsReportToPDF(
  doc: InstanceType<typeof PDFDocument>,
  report: EarningsReportDto,
) {
  doc.fontSize(16).text('Earnings Report', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Total Earnings: KES ${report.totalEarnings}`);
  doc.text(`Total Revenue: KES ${report.totalRevenue}`);
  doc.text(`Period Earnings: KES ${report.periodEarnings}`);
  doc.text(`Completed Payments: ${report.completedPayments}`);
  doc.text(`Pending Payments: ${report.pendingPayments}`);
  doc.text(`Average Payment: KES ${report.averagePayment}`);
  doc.moveDown();
  doc.fontSize(14).text('Monthly Earnings:', { underline: true });
  report.monthlyEarnings.forEach((month) => {
    doc
      .fontSize(12)
      .text(
        `${month.month}: KES ${month.earnings} (${month.transactions} transactions)`,
      );
  });
  doc.moveDown();
  doc.fontSize(14).text('Top Customers:', { underline: true });
  report.topCustomers.forEach((customer, idx) => {
    doc
      .fontSize(12)
      .text(
        `${idx + 1}. ${customer.firstName} ${customer.lastName} | Email: ${customer.email} | Parcels: ${customer.totalParcels} | Spent: KES ${customer.totalSpent}`,
      );
  });
  doc.moveDown();
}

export function writeStatisticsReportToPDF(
  doc: InstanceType<typeof PDFDocument>,
  report: StatisticsReportDto,
) {
  doc.fontSize(16).text('Statistics Report', { underline: true });
  doc.moveDown();
  doc.fontSize(14).text('Overview:', { underline: true });
  doc.fontSize(12).text(`Total Users: ${report.overview.totalUsers}`);
  doc.text(`Total Parcels: ${report.overview.totalParcels}`);
  doc.text(`Total Earnings: KES ${report.overview.totalEarnings}`);
  doc.text(`Total Reviews: ${report.overview.totalReviews}`);
  doc.moveDown();
  doc.fontSize(14).text('Growth Metrics:', { underline: true });
  doc
    .fontSize(12)
    .text(`Users Growth: ${report.growth.usersGrowth.toFixed(1)}%`);
  doc.text(`Parcels Growth: ${report.growth.parcelsGrowth.toFixed(1)}%`);
  doc.text(`Earnings Growth: ${report.growth.earningsGrowth.toFixed(1)}%`);
  doc.moveDown();
  doc.fontSize(14).text('Performance:', { underline: true });
  doc
    .fontSize(12)
    .text(
      `Average Delivery Time: ${report.performance.averageDeliveryTime.toFixed(2)} days`,
    );
  doc.text(
    `Delivery Success Rate: ${report.performance.deliverySuccessRate.toFixed(1)}%`,
  );
  doc.text(
    `Customer Satisfaction Rate: ${report.performance.customerSatisfactionRate.toFixed(2)}`,
  );
  doc.moveDown();
  doc.fontSize(14).text('Recent Activity:', { underline: true });
  doc.fontSize(12).text(`Recent Users: ${report.recentActivity.recentUsers}`);
  doc.text(`Recent Parcels: ${report.recentActivity.recentParcels}`);
  doc.text(`Recent Reviews: ${report.recentActivity.recentReviews}`);
  doc.moveDown();
}
