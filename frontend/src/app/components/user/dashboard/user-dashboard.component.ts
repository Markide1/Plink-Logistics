import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ParcelService } from '../../../services/parcel.service';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { Inject } from '@angular/core';


@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  isLoading = true;
  currentUser: any = null;
  user = { firstName: '' };
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private parcelService: ParcelService,
    private userService: UserService,
    @Inject(NotificationService) private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadCurrentUser() {
    const userSub = this.authService.currentUser$.pipe().subscribe((user) => {
      this.currentUser = user;
      this.user.firstName = user?.firstName || '';
      this.cdr.markForCheck();
    });
    this.subscriptions.add(userSub);
  }

  private loadUserNotifications() {
    const notificationsSub = this.userService.getUserNotifications(1, 5).subscribe({
      next: (notifications: any[]) => {
        this.notifications = notifications.slice(0, 5);
        this.cdr.markForCheck();
      },
      error: () => {},
    });
    this.subscriptions.add(notificationsSub);
  }

  goToMyParcels() {
    this.router.navigate(['/dashboard/user/parcels']);
  }

  goToTrack() {
    this.router.navigate(['/dashboard/user/track']);
  }

  goToReviews() {
    this.router.navigate(['/dashboard/user/reviews']);
  }

  goToAccount() {
    this.router.navigate(['/dashboard/user/profile']);
  }
}
