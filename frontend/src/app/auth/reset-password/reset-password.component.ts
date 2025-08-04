import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  providers: [AuthService]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoggedIn = false;
  isLoading = false; 

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Initialize form with email control (disabled)
    this.resetPasswordForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      resetCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator } as any);
  }

  ngOnInit(): void {
    // Get email from query param and set it in the form
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.resetPasswordForm.get('email')?.setValue(email);
      this.message = `Please check your email (${email}) for the 6-digit reset code.`;
      this.messageType = 'success';
    }
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onResetCodeInput(event: Event) {
    // Only allow numeric input
    const value = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limitedValue = value.slice(0, 6);
    
    // Update the form control
    this.resetPasswordForm.get('resetCode')?.setValue(limitedValue);
    
    // Update the input value to reflect changes
    (event.target as HTMLInputElement).value = limitedValue;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getResetCodeErrorMessage(): string {
    const control = this.resetPasswordForm.get('resetCode');
    if (control?.hasError('required')) return 'Reset code is required';
    if (control?.hasError('pattern')) return 'Reset code must be 6 digits';
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.resetPasswordForm.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.resetPasswordForm.get('confirmPassword');
    if (control?.hasError('required')) return 'Please confirm your password';
    if (control?.hasError('mismatch')) return 'Passwords do not match';
    return '';
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }
    this.isLoading = true;
    const email = this.resetPasswordForm.get('email')?.value;
    const resetCode = this.resetPasswordForm.get('resetCode')?.value;
    const password = this.resetPasswordForm.get('password')?.value;
    const confirmPassword = this.resetPasswordForm.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.resetPasswordForm.get('confirmPassword')?.setErrors({ mismatch: true });
      this.isLoading = false;
      return;
    }

    this.message = '';
    this.messageType = 'success';

    this.authService.resetPassword(resetCode, password, email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.message = response?.message || 'Password updated successfully. You can now log in.';
        this.messageType = 'success';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.message = err?.error?.message || 'Failed to reset password. Please try again.';
        this.messageType = 'error';
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}