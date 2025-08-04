import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ParcelService } from '../../../services/parcel.service';
import { NotificationService } from '../../../services/notification.service';
import { Observable } from 'rxjs';
import { ReportData } from './report-types';

interface ReportFilter {
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  reportType: string;
  status: string;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-reports.html',
  styleUrls: ['./admin-reports.scss']
})
export class AdminReportsComponent implements OnInit, OnDestroy {
  protected readonly isLoading = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly reportData = signal<ReportData>({});

  protected filters: ReportFilter = {
    startDate: this.getDefaultDateFrom(),
    endDate: this.getDefaultDateTo(),
    dateFrom: this.getDefaultDateFrom(),
    dateTo: this.getDefaultDateTo(),
    reportType: 'statistics',
    status: 'ALL'
  };

  protected readonly reportTypes = [
    { value: 'users', label: 'Users Report' },
    { value: 'parcels', label: 'Parcels Report' },
    { value: 'earnings', label: 'Earnings Report' },
    { value: 'statistics', label: 'Statistics Report' },
    { value: 'full', label: 'Full Report' }
  ];

  protected readonly statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PICKED_UP', label: 'Picked Up' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  protected readonly exportFormats = [
    { value: 'csv', label: 'CSV' },
    { value: 'pdf', label: 'PDF' },
  ];

  private subscriptions = new Subscription();

  constructor(
    private parcelService: ParcelService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadReportData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private getDefaultDateFrom(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  }

  private getDefaultDateTo(): string {
    return new Date().toISOString().split('T')[0];
  }

  private loadReportData() {
    this.isLoading.set(true);

    this.filters.dateFrom = this.filters.startDate;
    this.filters.dateTo = this.filters.endDate;

    let reportType = this.filters.reportType;
    let params: Record<string, string> = {
      startDate: this.filters.startDate || '',
      endDate: this.filters.endDate || ''
    };

    let request$: Observable<any> | undefined;
    switch (reportType) {
      case 'users':
        request$ = this.parcelService.getUsersReport(params);
        break;
      case 'parcels':
        request$ = this.parcelService.getParcelsReport(params);
        break;
      case 'earnings':
        request$ = this.parcelService.getEarningsReport(params);
        break;
      case 'statistics':
        request$ = this.parcelService.getStatisticsReport(params);
        break;
      case 'full':
        request$ = this.parcelService.getFullReport(params);
        break;
      default:
        request$ = undefined;
    }

    if (request$) {
      request$.subscribe({
        next: (data: any) => {
          const reportData: ReportData = {};
          if (reportType === 'users') reportData.usersReport = data as ReportData['usersReport'];
          else if (reportType === 'parcels') reportData.parcelsReport = data as ReportData['parcelsReport'];
          else if (reportType === 'earnings') reportData.earningsReport = data as ReportData['earningsReport'];
          else if (reportType === 'statistics') reportData.statisticsReport = data as ReportData['statisticsReport'];
          else if (reportType === 'full') {
            if ((data as any).users) reportData.usersReport = (data as any).users;
            if ((data as any).parcels) reportData.parcelsReport = (data as any).parcels;
            if ((data as any).earnings) reportData.earningsReport = (data as any).earnings;
            if ((data as any).statistics) reportData.statisticsReport = (data as any).statistics;
          }
          this.reportData.set(reportData);
          this.isLoading.set(false);
        },
        error: () => {
          this.notificationService.showError('Error', 'Failed to load report data');
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  onFilterChange() {
    this.loadReportData();
  }

  onGenerateReport() {
    this.loadReportData();
  }

  onRefreshData() {
    this.loadReportData();
  }

  onPrintReport() {
    window.print();
  }

  onExportReport(format: string) {
    this.isExporting.set(true);

    const exportSub = this.parcelService.exportReport({
      startDate: this.filters.startDate,
      endDate: this.filters.endDate,
      reportType: this.filters.reportType,
      ...(this.filters.status !== 'ALL' && { status: this.filters.status })
    }, format.toLowerCase()).subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], { type: this.getContentType(format) });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.filters.reportType}-report-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.notificationService.showSuccess('Export Complete', `Report exported as ${format} successfully`);
        this.isExporting.set(false);
      },
      error: (error: unknown) => {
        console.error('Error exporting report:', error);
        this.notificationService.showError('Export Failed', 'Failed to export report');
        this.isExporting.set(false);
      }
    });
    this.subscriptions.add(exportSub);
  }

  private getContentType(format: string): string {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'csv':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }

  // Helper methods for template
  getCurrentDate(): string {
    return new Date().toISOString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  }

  formatPercentage(value: number | undefined): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  }

  formatDate(dateString: string | Date, short: boolean = false): string {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const options: Intl.DateTimeFormatOptions = short
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'DELIVERED': 'bg-green-500',
      'IN_TRANSIT': 'bg-blue-500',
      'PENDING': 'bg-yellow-500',
      'PICKED_UP': 'bg-indigo-500',
      'CANCELLED': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  }

  getPerformanceColor(value: number, type: 'time' | 'rate' | 'satisfaction'): string {
    if (type === 'time') {
      return value <= 2 ? 'text-green-600' : value <= 3 ? 'text-yellow-600' : 'text-red-600';
    } else if (type === 'rate') {
      return value >= 95 ? 'text-green-600' : value >= 90 ? 'text-yellow-600' : 'text-red-600';
    } else {
      return value >= 4.5 ? 'text-green-600' : value >= 4 ? 'text-yellow-600' : 'text-red-600';
    }
  }

  // Data accessor methods based on selected report type
  getTotalParcels(): number {
    const data = this.reportData();
    switch (this.filters.reportType) {
      case 'parcels':
        return data.parcelsReport?.totalParcels || 0;
      case 'statistics':
        return data.statisticsReport?.overview.totalParcels || 0;
      default:
        return 0;
    }
  }

  getTotalRevenue(): number {
    const data = this.reportData();
    switch (this.filters.reportType) {
      case 'earnings':
        return data.earningsReport?.totalRevenue || 0;
      case 'statistics':
        return data.statisticsReport?.overview.totalEarnings || 0;
      default:
        return 0;
    }
  }

  getAverageDeliveryTime(): number {
    const data = this.reportData();
    return data.statisticsReport?.performance.averageDeliveryTime || 0;
  }

  getOnTimeDeliveryRate(): number {
    const data = this.reportData();
    return data.statisticsReport?.performance.deliverySuccessRate || 0;
  }

  getStatusBreakdown(): Array<{ status: string; count: number; percentage: number }> {
    const data = this.reportData();
    const breakdown: Array<{ status: string; count: number; percentage?: number }> = data.parcelsReport?.parcelsByStatus || [];
    
    // Calculate percentages if not already present
    const total = breakdown.reduce((sum: number, item: { status: string; count: number; percentage?: number }) => sum + item.count, 0);
    return breakdown.map((item: { status: string; count: number; percentage?: number }) => ({
      ...item,
      percentage: total > 0 ? (item.count / total) * 100 : 0
    }));
  }

  getRevenueByMonth(): Array<{ month: string; revenue: number }> {
    const data = this.reportData();
    return data.earningsReport?.monthlyEarnings?.map(item => ({
      month: item.month,
      revenue: item.earnings
    })) || [];
  }

  getMaxRevenue(): number {
    const revenues = this.getRevenueByMonth().map(item => item.revenue);
    return revenues.length ? Math.max(...revenues) : 1;
  }

}