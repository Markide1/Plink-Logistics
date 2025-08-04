import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class VerifyEmailComponent implements OnInit {
  verifyForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }

  onSubmit() {
    if (this.verifyForm.valid) {
      this.isLoading = true;
      this.authService.verifyEmail(this.email, this.verifyForm.value.code).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Email verified! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { queryParams: { email: this.email } });
          }, 2000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Verification failed. Please try again.';
        }
      });
    }
  }

  resendCode() {
    this.authService.requestVerificationCode(this.email).subscribe({
      next: () => {
        this.successMessage = 'Verification code resent!';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to resend code.';
      }
    });
  }
}