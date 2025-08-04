import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UpdateUserData, PaginatedResponse } from '../models/types';

// BackendResponse interface
export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

export type { User, UpdateUserData, PaginatedResponse };

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  Users: number;
  adminUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: 'ADMIN' | 'USER' | 'ALL',
    isActive?: boolean
  ): Observable<PaginatedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (role && role !== 'ALL') {
      params = params.set('role', role);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params });
  }

  // Updated to handle backend response format
  getProfile(): Observable<BackendResponse<User>> {
    return this.http.get<BackendResponse<User>>(`${environment.apiUrl}/auth/profile`);
  }

  getUser(id: string): Observable<BackendResponse<User>> {
    return this.http.get<BackendResponse<User>>(`${this.apiUrl}/${id}`);
  }

  // Updated to handle backend response format
  updateUser(id: string, userData: UpdateUserData | FormData): Observable<BackendResponse<User>> {
    // If FormData, do not set Content-Type header (let browser set multipart/form-data)
    if (userData instanceof FormData) {
      return this.http.put<BackendResponse<User>>(`${this.apiUrl}/${id}`, userData);
    }
    // Otherwise, send as JSON
    return this.http.put<BackendResponse<User>>(`${this.apiUrl}/${id}`, userData, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Updated to handle backend response format
  changePassword(userId: string, newPassword: string): Observable<BackendResponse<{ message: string }>> {
    return this.http.put<BackendResponse<{ message: string }>>(`${this.apiUrl}/change-password/${userId}`, {
      newPassword
    });
  }

  activateUser(id: string): Observable<BackendResponse<{ message: string }>> {
    return this.http.put<BackendResponse<{ message: string }>>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateUser(id: string): Observable<BackendResponse<{ message: string }>> {
    return this.http.put<BackendResponse<{ message: string }>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  deleteUser(id: string): Observable<BackendResponse<{ message: string }>> {
    return this.http.delete<BackendResponse<{ message: string }>>(`${this.apiUrl}/${id}`);
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${environment.apiUrl}/admin/dashboard`);
  }

  getUserNotifications(page: number = 1, pageSize: number = 10): Observable<any[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any[]>(`${this.apiUrl}/notifications`, { params });
  }

  markNotificationAsRead(notificationId: string): Observable<BackendResponse<{ message: string }>> {
    return this.http.put<BackendResponse<{ message: string }>>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<BackendResponse<{ message: string }>> {
    return this.http.put<BackendResponse<{ message: string }>>(`${this.apiUrl}/notifications/mark-all-read`, {});
  }
}