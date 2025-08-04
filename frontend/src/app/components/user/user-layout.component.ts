import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { NotificationComponent } from '../shared/notification/notification.component';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent, NotificationComponent, RouterModule],
  templateUrl: './user-layout.html',
  styleUrls: [],
})
export class UserLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  private readonly SIDEBAR_STATE_KEY = 'user_sidebar_collapsed';

  ngOnInit() {
    this.loadSidebarState();
  }

  private loadSidebarState() {
    const savedState = localStorage.getItem(this.SIDEBAR_STATE_KEY);
    if (savedState !== null) {
      this.isSidebarCollapsed = JSON.parse(savedState);
    }
  }

  private saveSidebarState() {
    localStorage.setItem(this.SIDEBAR_STATE_KEY, JSON.stringify(this.isSidebarCollapsed));
  }

  onToggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.saveSidebarState();
  }
}
