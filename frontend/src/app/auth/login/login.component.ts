import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  isLoggedIn = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.authService.logout?.();
    this.router.navigate(['/auth/login']).then(() => {
      setTimeout(() => {
        this.notificationService.showInfo('Logged out', 'Successfully logged out.');
      }, 0);
    });
  }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras && nav.extras.state && nav.extras.state['notification']) {
      const notif = nav.extras.state['notification'];
      if (notif.type === 'success') {
        this.notificationService.showSuccess(notif.title, notif.message);
      } else if (notif.type === 'error') {
        this.notificationService.showError(notif.title, notif.message);
      } else if (notif.type === 'warning') {
        this.notificationService.showWarning(notif.title, notif.message);
      } else if (notif.type === 'info') {
        this.notificationService.showInfo(notif.title, notif.message);
      }
    }
    this.isLoggedIn = this.authService.isAuthenticated();

    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.credentials.email = emailFromQuery;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.authService.login(this.credentials.email, this.credentials.password).subscribe({
      next: (response) => {
        if (response.accessToken && response.user) {
          if (response.user.role === 'ADMIN') {
            this.router.navigate(['/dashboard/admin']);
          } else {
            this.router.navigate(['/home']);
          }
          this.notificationService.showSuccess('Login Successful', `Welcome ${response.user.firstName}!`);
        } else {
          this.errorMessage = 'Login failed';
          this.notificationService.showError('Login Failed', 'Invalid credentials.');
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        this.notificationService.showError('Login Failed', this.errorMessage);
      }
    });
  }

  onSubmit(form: any): void {
    if (form.valid) {
      this.login();
    }
  }
}