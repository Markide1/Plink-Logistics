import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new Subject<NotificationData>();
  private notifications: NotificationData[] = [];

  getNotifications(): Observable<NotificationData> {
    return this.notificationSubject.asObservable();
  }

  showSuccess(title: string, message: string): void {
    this.show({
      type: 'success',
      title,
      message,
      duration: 3000,
    });
  }

  showError(title: string, message: string): void {
    this.show({
      type: 'error',
      title,
      message,
      duration: 3000,
    });
  }

  showInfo(title: string, message: string): void {
    this.show({
      type: 'info',
      title,
      message,
      duration: 3000,
    });
  }

  showWarning(title: string, message: string): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration: 3000,
    });
  }

  showWithAction(
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void
  ): void {
    this.show({
      type,
      title,
      message,
      duration: 3000,
      action: {
        label: actionLabel,
        callback: actionCallback,
      },
    });
  }

  private show(notification: Omit<NotificationData, 'id'>): void {
    // Always set duration to 3000ms
    const notificationWithDuration = {
      ...notification,
      duration: 3000,
    };

    // Prevent duplicate notifications (same type, title, message)
    const isDuplicate = this.notifications.some(
      (n) =>
        n.type === notificationWithDuration.type &&
        n.title === notificationWithDuration.title &&
        n.message === notificationWithDuration.message
    );
    if (isDuplicate) {
      return;
    }

    const notificationData: NotificationData = {
      ...notificationWithDuration,
      id: this.generateId(),
    };
    this.notifications.push(notificationData);
    this.notificationSubject.next(notificationData);
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  private generateId(): string {
    return Math.random().toString(36).slice(2, 11);
  }
}
