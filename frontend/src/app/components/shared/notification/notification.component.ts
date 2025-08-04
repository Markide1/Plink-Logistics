import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NotificationService,
  NotificationData,
} from '../../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: NotificationData[] = [];
  private subscription?: Subscription;
  private timers: { [id: string]: any } = {};

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.subscription = this.notificationService
      .getNotifications()
      .subscribe((notification) => {
        this.notifications.push(notification);
        this.timers[notification.id] = setTimeout(() => {
          this.removeNotification(notification.id);
        }, 3000);
      });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    Object.values(this.timers).forEach((timer) => clearTimeout(timer));
  }

  getNotificationClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-white border-l-4 border-blue-500 text-blue-800';
      case 'error':
        return 'bg-white border-l-4 border-red-500 text-red-800';
      case 'warning':
        return 'bg-white border-l-4 border-yellow-500 text-yellow-800';
      case 'info':
        return 'bg-white border-l-4 border-blue-400 text-blue-800';
      default:
        return 'bg-white border-l-4 border-gray-200 text-gray-800';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return '';
    }
  }

  handleAction(notification: NotificationData) {
    if (notification.action) {
      notification.action.callback();
      this.removeNotification(notification.id);
    }
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notificationService.remove(id);
    if (this.timers[id]) {
      clearTimeout(this.timers[id]);
      delete this.timers[id];
    }
  }
}