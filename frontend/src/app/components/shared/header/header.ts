import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit {
  dashboardLink: string = '/dashboard';
  isLoggedIn: boolean = false;
  username: string = '';
  showUserMenu: boolean = false;
  showMobileMenu: boolean = false;
  profileDropdownOpen: boolean = false;
  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Check login state on init and subscribe to changes
    this.isLoggedIn = this.authService.isAuthenticated();
    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.dashboardLink = user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user';
    }

    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.dashboardLink = user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user';
      } else {
        this.dashboardLink = '/dashboard';
      }
    });
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  goToProfile() {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      const role = user.role === 'ADMIN' ? 'admin' : 'user';
      this.router.navigate([`/dashboard/${role}/profile`]);
      this.profileDropdownOpen = false;
    }
  }

  logout() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      this.authService.logout();
      this.isLoggedIn = false;
      this.showUserMenu = false;
      this.showMobileMenu = false;
      this.profileDropdownOpen = false;
      this.router.navigate(['/auth/login'], {
        state: {
          notification: {
            type: 'success',
            title: 'Logged out',
            message: 'You have been logged out successfully.'
          }
        }
      });
    } catch (error: any) {
      this.router.navigate(['/auth/login'], {
        state: {
          notification: {
            type: 'error',
            title: 'Logout Failed',
            message: error?.message || 'An error occurred during logout.'
          }
        }
      });
    }
  }
}
