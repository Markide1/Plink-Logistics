import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../ui/icon/icon';
import { TrackingInfo, TrackingStatus } from '../../../services/tracking.service';

@Component({
  selector: 'app-tracking-info-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './tracking-info-card.html',
  styleUrls: ['./tracking-info-card.scss']
})
export class TrackingInfoCardComponent {
  @Input() trackingInfo!: TrackingInfo;
  @Input() realTimeEnabled: boolean = false;
  @Output() refresh = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() toggleRealTime = new EventEmitter<boolean>();

  getStatusIcon(status: TrackingStatus): IconName {
    const iconMap: { [key in TrackingStatus]: IconName } = {
      'pending': 'clock',
      'picked_up': 'package',
      'in_transit': 'truck',
      'delivered': 'check',
      'cancelled': 'x'
    };
    return iconMap[status] || 'clock';
  }

  getStatusLabel(status: TrackingStatus): string {
    const labelMap = {
      'pending': 'Order Confirmed',
      'picked_up': 'Package Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Order Cancelled'
    };
    return labelMap[status] || 'Unknown Status';
  }

  getServiceTypeLabel(serviceType: string): string {
    const labelMap: { [key: string]: string } = {
      'Light Package': 'Light Package',
      'Medium Package': 'Medium Package',
      'Heavy Package': 'Heavy Package'
    };
    return labelMap[serviceType] || 'Light Package';
  }

  getProgressPercentage(): number {
    const statusProgress = {
      'pending': 10,
      'picked_up': 25,
      'in_transit': 60,
      'delivered': 100,
      'cancelled': 0
    };
    return statusProgress[this.trackingInfo.status] || 0;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }


  onToggleRealTime(): void {
    this.toggleRealTime.emit(!this.realTimeEnabled);
  }
}
