import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  User,
  UserService,
  BackendResponse,
} from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
})
export class UserProfileComponent implements OnInit {
  profile: User = {} as User;
  profileInitials: string = '';
  isSavingProfile = false;
  isSavingPassword = false;
  isSavingImage = false;
  newPassword = '';
  showPassword = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.updateProfileInitials();
  }

  reloadProfile() {
    this.loadProfile();
  }

  updateProfileInitials(): void {
    if (this.profile && this.profile.name) {
      const names = this.profile.name.trim().split(' ');
      this.profileInitials =
        names.length > 1
          ? names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase()
          : names[0][0].toUpperCase();
    } else {
      this.profileInitials = '';
    }
  }

  private loadProfile() {
    this.clearMessages();
    this.userService.getProfile().subscribe({
      next: (response: BackendResponse<User>) => {
        this.profile = {
          ...response.data,
          name:
            response.data.name ||
            `${response.data.firstName || ''} ${
              response.data.lastName || ''
            }`.trim(),
          phone: response.data.phone || '',
          address: response.data.address || '',
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          profileImage: response.data.profileImage || '',
        };
        this.notificationService.showSuccess(
          'Profile Loaded',
          'Your profile was loaded successfully.'
        );
      },
      error: (err) => {
        let msg = this.handleError(err);
        if (err?.error?.message) {
          msg = err.error.message;
        }
        this.showError(msg);
        this.notificationService.showError('Profile Load Failed', msg);
      },
    });
  }

  get displayName(): string {
    if (this.profile.firstName || this.profile.lastName) {
      return `${this.profile.firstName || ''} ${
        this.profile.lastName || ''
      }`.trim();
    }
    if (this.profile.name) {
      return this.profile.name;
    }
    return 'User';
  }

  saveProfile() {
    if (!this.profile?.id || this.isSavingProfile) return;

    this.isSavingProfile = true;
    this.clearMessages();
    const updateData: any = {};
    if (this.profile.firstName) updateData.firstName = this.profile.firstName;
    if (this.profile.lastName) updateData.lastName = this.profile.lastName;
    if (this.profile.phone) updateData.phone = this.profile.phone;
    if (this.profile.address) updateData.address = this.profile.address;
    if (
      this.profile.name &&
      !this.profile.firstName &&
      !this.profile.lastName
    ) {
      const parts = this.profile.name.trim().split(' ');
      updateData.firstName = parts[0] || '';
      updateData.lastName = parts.slice(1).join(' ') || '';
    }

    Object.keys(updateData).forEach(
      (key) =>
        (updateData[key] === undefined || updateData[key] === null) &&
        delete updateData[key]
    );

    this.userService.updateUser(this.profile.id, updateData).subscribe({
      next: (response: BackendResponse<User>) => {
        this.profile = { ...this.profile, ...response.data };
        this.authService.setCurrentUser({ ...this.profile });
        this.isSavingProfile = false;
        this.showSuccess(response.message || 'Profile updated successfully!');
        this.notificationService.showSuccess(
          'Profile Updated',
          response.message || 'Profile updated successfully!'
        );
      },
      error: (err) => {
        this.isSavingProfile = false;
        let msg = this.handleError(err);
        if (err?.error?.message) {
          msg = err.error.message;
        }
        this.showError(msg);
        this.notificationService.showError('Profile Update Failed', msg);
      },
    });
  }

  changePassword() {
    if (!this.isValidPassword() || !this.profile?.id || this.isSavingPassword)
      return;

    this.isSavingPassword = true;
    this.clearMessages();

    this.userService
      .changePassword(this.profile.id, this.newPassword.trim())
      .subscribe({
        next: (response: BackendResponse<{ message: string }>) => {
          this.newPassword = '';
          this.showPassword = false;
          this.isSavingPassword = false;
          this.showSuccess(
            response.message || 'Password updated successfully!'
          );
          this.notificationService.showSuccess(
            'Password Changed',
            response.message || 'Password updated successfully!'
          );
        },
        error: (err) => {
          this.isSavingPassword = false;
          const msg = this.handleError(err);
          this.showError(msg);
          this.notificationService.showError('Password Change Failed', msg);
        },
      });
  }

  private isValidPassword(): boolean {
    if (!this.newPassword || this.newPassword.trim().length < 6) {
      this.showError('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.profile.profileImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Message handling methods
  private showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private handleError(error: any): string {
    console.error('Error occurred:', error);
    return 'An unexpected error occurred. Please try again.';
  }
}
