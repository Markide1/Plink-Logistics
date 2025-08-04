import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login-template',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-template.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginTemplateComponent {
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
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(form: any): void {
    if (form.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      // Pass email and password separately
      this.authService.login(this.credentials.email, this.credentials.password).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Use response.accessToken and response.user directly
          if (response.accessToken && response.user) {
            if (response.user.role === 'ADMIN') {
              this.router.navigate(['/dashboard/admin']).then(() => {
                setTimeout(() => {
                  this.notificationService.showSuccess('Login Successful', 'Welcome back admin!');
                }, 0);
              });
            } else {
              this.router.navigate(['/home']).then(() => {
                setTimeout(() => {
                  this.notificationService.showSuccess('Login Successful', `Welcome ${response.user.firstName}!`);
                }, 0);
              });
            }
          } else {
            this.errorMessage = 'Login failed';
            setTimeout(() => {
              this.notificationService.showError('Login Failed', 'Invalid credentials.');
            }, 0);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          setTimeout(() => {
            this.notificationService.showError('Login Failed', this.errorMessage);
          }, 0);
        }
      });
    }
  }
}
