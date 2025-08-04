import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { NotificationComponent } from '../shared/notification/notification.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NotificationComponent],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss']
})
export class AdminLayoutComponent implements OnInit {
  currentUser: any = null;
  isSidebarCollapsed: boolean = false;
  private readonly SIDEBAR_STATE_KEY = 'admin_sidebar_collapsed';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Load sidebar state from localStorage
    this.loadSidebarState();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
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

  get userInitials(): string {
    if (!this.currentUser?.name) return 'A';
    return this.currentUser.name.split(' ').map((name: string) => name[0]).join('').toUpperCase();
  }

  onToggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.saveSidebarState();
  }
}
