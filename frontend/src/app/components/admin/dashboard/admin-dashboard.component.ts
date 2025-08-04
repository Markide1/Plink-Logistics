import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Parcel } from '../../../services/parcel.service';
import { ParcelService } from '../../../services/parcel.service';
import { UserService, User } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { DashboardStatsComponent, DashboardStats } from './dashboard-stats.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardStatsComponent],
  templateUrl: './admin-dashboard.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  dashboardStats: DashboardStats = {
    totalParcels: 0,
    pendingParcels: 0,
    activeDelivery: 0,
    totalRevenue: 0,
    users: 0
  };

  recentParcels: Parcel[] = [];
  recentUsers: User[] = [];
  isLoading = true;
  currentUser: any = null;
  private dataLoaded = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private parcelService: ParcelService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 0);
      return;
    }

    this.loadCurrentUser();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadCurrentUser() {
    const userSub = this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.currentUser = user;
        if (user.role !== 'ADMIN') {
          setTimeout(() => {
            this.router.navigate(['/dashboard/user']);
          }, 0);
          return;
        }
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(userSub);
  }

  private loadDashboardData() {
    if (this.dataLoaded) {
      return;
    }

    this.dataLoaded = true;
    this.loadDashboardStats();
    this.loadRecentData();
  }

  private loadDashboardStats() {
    this.isLoading = true;
    const statsSub = this.parcelService.getAdminDashboard().pipe(take(1)).subscribe({
      next: (response: any) => {
        const dashboardData = response.data || response;
        this.dashboardStats = {
          totalParcels: dashboardData.totalParcels || 0,
          pendingParcels: dashboardData.pendingParcels || 0,
          activeDelivery: dashboardData.activeDelivery || 0,
          totalRevenue: dashboardData.totalRevenue || 0,
          users: dashboardData.users || 0
        };
        this.recentParcels = dashboardData.recentParcels ? [...dashboardData.recentParcels.slice(0, 5)] : [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.notificationService.showError('Error', 'Failed to load dashboard statistics');
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(statsSub);
  }
  
  private loadRecentData() {
    const usersSub = this.userService.getAllUsers(1, 5).pipe(take(1)).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        if (data && data.users && Array.isArray(data.users)) {
          this.recentUsers = [...data.users];
        } else if (Array.isArray(data)) {
          this.recentUsers = [...data];
        } else {
          this.recentUsers = [];
        }
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error loading recent users:', error);
        this.notificationService.showError('Error', 'Failed to load recent users');
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(usersSub);
  }

  // Navigation methods
  goToUsers() {
    this.router.navigate(['/dashboard/admin/users']);
  }

  goToParcels() {
    this.router.navigate(['/dashboard/admin/parcels']);
  }

  goToReports() {
    this.router.navigate(['/dashboard/admin/reports']);
  }

  goToSettings() {
    this.router.navigate(['/dashboard/admin/settings']);
  }

  onStatClicked(statType: string) {
    switch (statType) {
      case 'users':
        this.goToUsers();
        break;
      case 'parcels':
        this.goToParcels();
        break;
      case 'delivered':
        this.goToParcels();
        break;
      case 'revenue':
        this.goToReports();
        break;
    }
  }
}
