import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Parcel {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientAddress: string;
  weight: number;
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  serviceType: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY';
  price: number;
  createdAt: string;
  routePolyline?: [number, number][]; 
  updatedAt: string;
}

export interface User {
name: any;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  address?: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:3000/api';
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  /**
   * Authentication Methods
   */
  
  login(email: string, password: string): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.http.post<ApiResponse<{ user: User; token: string }>>(`${this.baseUrl}/auth/login`, {
      email,
      password
    }, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.http.post<ApiResponse<{ user: User; token: string }>>(`${this.baseUrl}/auth/register`, userData, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.baseUrl}/auth/forgot-password`, {
      email
    }, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.baseUrl}/auth/reset-password`, {
      token,
      newPassword
    }, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * User Methods
   */
  
  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/profile`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllUsers(page: number = 1, pageSize: number = 10): Observable<ApiResponse<PaginatedResponse<User>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<PaginatedResponse<User>>>(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Parcel Methods
   */
  
  createParcel(parcelData: Omit<Parcel, 'id' | 'trackingNumber' | 'status' | 'createdAt' | 'updatedAt'>): Observable<ApiResponse<Parcel>> {
    return this.http.post<ApiResponse<Parcel>>(`${this.baseUrl}/parcels`, parcelData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getParcel(id: string): Observable<ApiResponse<Parcel>> {
    return this.http.get<ApiResponse<Parcel>>(`${this.baseUrl}/parcels/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  trackParcel(trackingNumber: string): Observable<ApiResponse<Parcel>> {
    return this.http.get<ApiResponse<Parcel>>(`${this.baseUrl}/parcels/track/${trackingNumber}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  getUserParcels(page: number = 1, pageSize: number = 10): Observable<ApiResponse<PaginatedResponse<Parcel>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<PaginatedResponse<Parcel>>>(`${this.baseUrl}/parcels/user`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllParcels(page: number = 1, pageSize: number = 10, status?: string): Observable<ApiResponse<PaginatedResponse<Parcel>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PaginatedResponse<Parcel>>>(`${this.baseUrl}/parcels`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateParcel(id: string, parcelData: Partial<Parcel>): Observable<ApiResponse<Parcel>> {
    return this.http.put<ApiResponse<Parcel>>(`${this.baseUrl}/parcels/${id}`, parcelData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteParcel(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/parcels/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Dashboard Methods
   */
  
  getDashboardStats(): Observable<ApiResponse<{
    totalParcels: number;
    pendingParcels: number;
    activeDelivery: number;
    totalRevenue: number;
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/admin/dashboard`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Contact Methods
   */
  
  sendContactMessage(messageData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.baseUrl}/contact`, messageData, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Utility Methods
   */
  
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return this.headers.set('Authorization', `Bearer ${token}`);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = error.error.message;
    } else {
      // Backend error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Bad request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 403:
            errorMessage = 'Forbidden. You do not have permission to access this resource.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = `Error: ${error.status} - ${error.message}`;
        }
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * File Upload Methods
   */
  
  uploadFile(file: File, type: 'profile' | 'parcel'): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post<ApiResponse<{ url: string }>>(`${this.baseUrl}/upload`, formData, {
      headers: this.getAuthHeaders().delete('Content-Type') 
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Helper method to check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  /**
   * Helper method to get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Helper method to remove token
   */
  removeToken(): void {
    localStorage.removeItem('auth_token');
  }
}
