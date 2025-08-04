import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoggedIn = false;
  

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isSubmitting = true;
      this.message = '';

      const email = this.forgotPasswordForm.get('email')?.value;

      this.authService.forgotPassword(email).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.messageType = 'success';
          this.message = 'Password reset code has been sent to your email address.';
          
          // Show success notification
          this.notificationService.showSuccess(
            'Email Sent', 
            'Password reset code has been sent to your email address.'
          );
          
          this.forgotPasswordForm.reset();
          
          // Redirect to reset-password page after short delay
          setTimeout(() => {
            this.router.navigate(['/auth/reset-password'], { queryParams: { email } });
          }, 1500);
        },
        error: (error: any) => {
          this.isSubmitting = false;
          this.messageType = 'error';
          this.message = error.error?.message || 'An error occurred. Please try again.';
          
          // Show error notification
          this.notificationService.showError(
            'Failed to Send Email',
            this.message
          );
          
          console.error('Forgot password error:', error);
        }
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
