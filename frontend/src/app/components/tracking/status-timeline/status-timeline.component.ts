import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../ui/icon/icon';
import { TrackingEvent, TrackingStatus } from '../../../services/tracking.service';

@Component({
  selector: 'app-status-timeline',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './status-timeline.html',
  styleUrls: ['./status-timeline.scss']
})
export class StatusTimelineComponent implements OnInit {
  @Input() events: TrackingEvent[] = [];
  @Input() currentStatus: TrackingStatus = 'pending';

  ngOnInit() {
    // Sort events by timestamp
    this.events = this.events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  isEventActive(event: TrackingEvent): boolean {
    const statusOrder = ['pending', 'picked_up', 'in_transit', 'delivered'];
    const currentIndex = statusOrder.indexOf(this.currentStatus);
    const eventIndex = statusOrder.indexOf(event.status);
    return eventIndex <= currentIndex;
  }

  isEventCurrent(event: TrackingEvent): boolean {
    return event.status === this.currentStatus;
  }

  getEventIcon(status: TrackingStatus): IconName {
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
    const labelMap: Record<TrackingStatus, string> = {
      'pending': 'Pending',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return labelMap[status] ?? 'Unknown';
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' }) + ', ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}
