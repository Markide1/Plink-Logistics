import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BackendResponse, PaginatedResponse, PaginatedData, Parcel } from '../models/types';

export type { BackendResponse, PaginatedResponse, PaginatedData, Parcel };

export interface CreateParcelData {
  description: string;
  weight: number;
  receiverId?: string;
  receiverName?: string;
  receiverEmail: string;
  receiverPhone?: string;
  pickupLocation: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLocation: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

/**
 * Define types for report responses (or import from backend DTOs if available)
 */
export interface UsersReport {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  users: Array<any>;
}
export interface ParcelsReport {
  totalParcels: number;
  newParcels: number;
  deliveredParcels: number;
  cancelledParcels: number;
  parcelsByStatus: Array<{ status: string; count: number; percentage?: number }>;
  parcels: Array<any>;
}
export interface EarningsReport {
  totalEarnings: number;
  totalRevenue: number;
  periodEarnings: number;
  completedPayments: number;
  pendingPayments: number;
  averagePayment: number;
  monthlyEarnings: Array<{ month: string; earnings: number; transactions: number }>;
  topCustomers: Array<any>;
}
export interface StatisticsReport {
  overview: any;
  growth: any;
  performance: any;
  recentActivity: any;
}
export interface FullReport {
  users: UsersReport;
  parcels: ParcelsReport;
  earnings: EarningsReport;
  statistics: StatisticsReport;
}

@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  /**
   * Get users report (Admin)
   */
  getUsersReport(params: Record<string, string>) {
    return this.http.get<UsersReport>(`${this.apiUrl.replace(/\/parcels$/, '')}/reports/users`, { params });
  }

  /**
   * Get parcels report (Admin)
   */
  getParcelsReport(params: Record<string, string>) {
    return this.http.get<ParcelsReport>(`${this.apiUrl.replace(/\/parcels$/, '')}/reports/parcels`, { params });
  }

  /**
   * Get earnings report (Admin)
   */
  getEarningsReport(params: Record<string, string>) {
    return this.http.get<EarningsReport>(`${this.apiUrl.replace(/\/parcels$/, '')}/reports/earnings`, { params });
  }

  /**
   * Get statistics report (Admin)
   */
  getStatisticsReport(params: Record<string, string>) {
    return this.http.get<StatisticsReport>(`${this.apiUrl.replace(/\/parcels$/, '')}/reports/statistics`, { params });
  }

  /**
   * Get full/summary report (Admin)
   */
  getFullReport(params: Record<string, string>) {
    return this.http.get<FullReport>(`${this.apiUrl.replace(/\/parcels$/, '')}/reports/summary`, { params });
  }
  /**
   * Get all parcels (Admin)
   */
  getAllParcels(page: number = 1, limit: number = 20, filters?: any): Observable<BackendResponse<PaginatedData<Parcel>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.status && filters.status !== 'ALL') {
        params = params.set('status', filters.status);
      }
      if (filters.search) {
        params = params.set('trackingNumber', filters.search);
      }
      if (filters.dateFrom) {
        params = params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('dateTo', filters.dateTo);
      }
    }

    return this.http.get<BackendResponse<PaginatedData<Parcel>>>(this.apiUrl, { params });
  }
  private readonly apiUrl = `${environment.apiUrl}/parcels`;
  constructor(private http: HttpClient) {}


  /**
   * Get user's sent parcels
   */
  getUserSentParcels(page: number = 1, limit: number = 10, userId?: string): Observable<PaginatedResponse<Parcel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (userId) {
      params = params.set('senderId', userId);
    }
    return this.http.get<PaginatedResponse<Parcel>>(`${this.apiUrl}`, { params });
  }

  /**
   * Get user's received parcels
   */
  getUserReceivedParcels(page: number = 1, limit: number = 10, userId?: string, userEmail?: string): Observable<PaginatedResponse<Parcel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (userId) {
      params = params.set('receiverId', userId);
    }
    if (userEmail) {
      params = params.set('receiverEmail', userEmail);
    }
    return this.http.get<PaginatedResponse<Parcel>>(`${this.apiUrl}`, { params });
  }

  /**
   * Get a specific parcel by ID
   */
  getParcel(id: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/${id}`);
  }

    /**
   * Mark a parcel as received (Customer)
   */
  markAsReceived(parcelId: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/${parcelId}/received`, {});
  }


  /**
   * Track a parcel by tracking number
   */
  trackParcel(trackingNumber: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.apiUrl}/track/${trackingNumber}`);
  }

  /**
   * Create a new parcel
   */
  createParcel(parcelData: CreateParcelData): Observable<Parcel> {
    return this.http.post<Parcel>(this.apiUrl, parcelData);
  }

  /**
   * Update parcel status (Admin only)
   */
  updateParcelStatus(id: string, status: string, location?: string): Observable<Parcel> { 
    const updateData: { status: string; currentLocation?: string } = { 
      status
    };
    if (location) {
      updateData.currentLocation = location;
    }
    return this.http.put<Parcel>(`${this.apiUrl}/${id}/status`, updateData);
  }

  /**
   * Bulk update parcel status (Admin only)
   */
  bulkUpdateStatus(parcelIds: string[], status: string): Observable<{ message: string; updatedCount: number }> {
    return this.http.put<{ message: string; updatedCount: number }>(`${this.apiUrl}/bulk-update-status`, {
      parcelIds,
      status
    });
  }

  /**
   * Delete a parcel (Admin only)
   */
  deleteParcel(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Add review to a parcel
   */
  addReview(parcelId: string, rating: number, content?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/reviews`, {
      parcelId,
      rating,
      content
    });
  }

  /**
   * Get reviews for a parcel
   */
  getParcelReviews(parcelId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${parcelId}/reviews`);
  }

  /**
   * Get all reviews (Admin only)
   */
  getAllReviews(page: number = 1, limit: number = 10, filters?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.rating && filters.rating !== 'ALL') {
        params = params.set('rating', filters.rating);
      }
      if (filters.dateFrom) {
        params = params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('dateTo', filters.dateTo);
      }
    }

    // Use HttpHeaders for Authorization header
    const token = localStorage.getItem('access_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.get<any>(`${environment.apiUrl}/reviews/admin/all`, { params, headers });
  }

  /**
   * Get review statistics (Admin only)
   */
  getReviewStats(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/reviews/stats`);
  }

  /**
   * Flag a review (Admin only)
   */
  flagReview(reviewId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${environment.apiUrl}/reviews/admin/${reviewId}/flag`, {});
  }

  /**
   * Delete a review (Admin only)
   */
  deleteReview(reviewId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/reviews/admin/${reviewId}`);
  }

  /**
   * Get admin dashboard statistics
   */
  getAdminDashboard(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/admin/dashboard`);
  }

  /**
   * Get parcel statistics (Admin only)
   */
  getParcelStats(): Observable<{
    totalParcels: number;
    pendingParcels: number;
    inTransitParcels: number;
    deliveredParcels: number;
    totalRevenue: number;
    recentParcels: Parcel[];
  }> {
    return this.http.get<any>(`${environment.apiUrl}/admin/dashboard`);
  }

  /**
   * Export report in specified format
   */
  exportReport(filters: any, format: string): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }
    if (filters.reportType && filters.reportType !== 'ALL') {
      params = params.set('reportType', filters.reportType);
    }
    if (filters.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    
    params = params.set('format', format);

    return this.http.get(`${environment.apiUrl}/reports/export`, {
      params,
      responseType: 'blob'
    });
  }

  /**
 * Get report data for admin dashboard (Admin only)
 */
getReportData(filters: any): Observable<any> {
  let params = new HttpParams();
  
  if (filters.startDate) {
    params = params.set('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params = params.set('endDate', filters.endDate);
  }
  if (filters.status && filters.status !== 'ALL') {
    params = params.set('status', filters.status);
  }
  
  // Get specific report type based on filter
  const reportType = filters.reportType || 'statistics';
  let endpoint = '';
  
  switch (reportType) {
    case 'users':
      endpoint = '/admin/reports/users';
      break;
    case 'parcels':
      endpoint = '/admin/reports/parcels';
      break;
    case 'earnings':
      endpoint = '/admin/reports/earnings';
      break;
    case 'statistics':
      endpoint = '/admin/reports/statistics';
      break;
    case 'full':
      endpoint = '/admin/reports/full';
      break;
    default:
      endpoint = '/admin/reports/statistics';
  }
  
  return this.http.get<any>(`${environment.apiUrl}${endpoint}`, { params });
}

/**
 * Export admin report in specified format (Admin only)
 */
exportAdminReport(filters: any, format: string): Observable<Blob> {
  let params = new HttpParams();
  
  if (filters.startDate) {
    params = params.set('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params = params.set('endDate', filters.endDate);
  }
  if (filters.reportType) {
    params = params.set('type', filters.reportType);
  }
  if (filters.status && filters.status !== 'ALL') {
    params = params.set('status', filters.status);
  }
  
  params = params.set('format', format);

  return this.http.get(`${environment.apiUrl}/admin/reports/export`, {
    params,
    responseType: 'blob'
  });
}


 /**
   * Get user's submitted reviews
   */
  getMyReviews(page: number = 1, limit: number = 10): Observable<{data: any[]}> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{data: any[]}>(`${environment.apiUrl}/reviews/my-reviews`, { params });
  }

  /**
   * Submit a parcel request
   */
  submitParcelRequest(parcelData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/request`, parcelData);
  }

  /**
   * Get all parcel requests (Admin only)
   */
  getParcelRequests(page: number = 1, limit: number = 10, filters?: any): Observable<PaginatedResponse<Parcel>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.status && filters.status !== 'ALL') {
        params = params.set('status', filters.status);
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.dateFrom) {
        params = params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('dateTo', filters.dateTo);
      }
    }

    return this.http.get<PaginatedResponse<Parcel>>(`${this.apiUrl}/requests`, { params });
  }

  /**
   * Approve a parcel request (Admin only)
   */
  approveParcelRequest(id: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/requests/${id}/approve`, {});
  }

  /**
   * Reject a parcel request (Admin only)
   */
  rejectParcelRequest(id: string, reason?: string): Observable<Parcel> {
    return this.http.put<Parcel>(`${this.apiUrl}/requests/${id}/reject`, { reason });
  }
}