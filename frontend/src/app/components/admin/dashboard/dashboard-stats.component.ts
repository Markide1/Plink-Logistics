import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DashboardStats {
  totalParcels: number;
  pendingParcels: number;
  activeDelivery: number;
  totalRevenue: number;
  users: number;
}

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-stats.html',
  styleUrls: ['./dashboard-stats.scss']
})
export class DashboardStatsComponent {
  @Input() stats: DashboardStats = {
    totalParcels: 0,
    pendingParcels: 0,
    activeDelivery: 0,
    totalRevenue: 0,
    users: 0
  };
  @Input() isLoading: boolean = false;
  @Output() statClicked = new EventEmitter<string>();

  onStatClick(statType: string) {
    this.statClicked.emit(statType);
  }

  formatRevenue(amount: number): string {
    return `Ksh ${amount.toFixed(2)}`;
  }
}
