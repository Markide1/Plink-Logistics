import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, BackendResponse, AuthResponse } from '../models/types';

// Re-export types for components
export type { User, BackendResponse, AuthResponse };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {
    const token = this.getToken();
    const userJson = localStorage.getItem('current_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch {
        localStorage.removeItem('current_user');
      }
    }
    if (token && !userJson) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          localStorage.setItem('current_user', JSON.stringify(user));
        },
        error: () => {
          this.logout();
        }
      });
    }
  }


  setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('current_user');
    }
  }

  register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<BackendResponse<AuthResponse>> {
    return this.http.post<BackendResponse<AuthResponse>>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.data.accessToken && response.data.user) {
          this.setToken(response.data.accessToken);
          this.currentUserSubject.next(response.data.user);
          localStorage.setItem('current_user', JSON.stringify(response.data.user));
        }
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<BackendResponse<AuthResponse>>(`${this.apiUrl}/login`, { email, password }).pipe(
      map(response => response.data),
      tap(data => {
        if (data && data.accessToken && data.user) {
          this.setToken(data.accessToken);
          this.currentUserSubject.next(data.user);
          localStorage.setItem('current_user', JSON.stringify(data.user));
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(resetCode: string, newPassword: string, email?: string): Observable<any> {
    const payload: any = {
      resetToken: resetCode,
      newPassword
    };
    if (email) {
      payload.email = email;
    }
    return this.http.post(`${this.apiUrl}/reset-password`, payload);
  }

  logout(): void {
    this.removeToken();
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<BackendResponse<User>>(`${this.apiUrl}/profile`).pipe(
      map(response => response.data)
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === 'ADMIN';
  }

  isUser(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === 'USER';
  }

  requestVerificationCode(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/request-verification-code`, { email });
  }

  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/verify-email`, { email, code });
  }
}
