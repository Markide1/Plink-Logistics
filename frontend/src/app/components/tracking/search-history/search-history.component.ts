import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../ui/icon/icon';
import { TrackingSearchHistory } from '../../../services/tracking.service';

@Component({
  selector: 'app-search-history',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './search-history.html',
  styleUrls: ['./search-history.scss']
})
export class SearchHistoryComponent {
  @Input() history: TrackingSearchHistory[] = [];
  @Output() selectHistory = new EventEmitter<TrackingSearchHistory>();
  @Output() clearHistory = new EventEmitter<void>();
  @Output() removeItem = new EventEmitter<TrackingSearchHistory>();

  getStatusIcon(status: string): IconName {
    const iconMap: { [key: string]: IconName } = {
      'pending': 'clock',
      'picked_up': 'package',
      'in_transit': 'truck',
      'delivered': 'check',
      'failed_delivery': 'x',
      'returned': 'arrow-left',
      'cancelled': 'x'
    };
    return iconMap[status] || 'clock';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      'pending': 'Pending',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return labelMap[status] || 'Unknown';
  }

  formatTrackingNumber(trackingNumber: string): string {
    if (!trackingNumber) return '';
    const cleaned = trackingNumber.trim().toUpperCase();
    if (cleaned.length >= 10) {
      return cleaned.replace(/(.{4})/g, '$1 ').trim();
    }
    return cleaned;
  }

  formatSearchTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  onSelectHistory(item: TrackingSearchHistory): void {
    this.selectHistory.emit(item);
  }

  onClearHistory(): void {
    this.clearHistory.emit();
  }

  onRemoveItem(item: TrackingSearchHistory, event: Event): void {
    event.stopPropagation();
    this.removeItem.emit(item);
  }
}
