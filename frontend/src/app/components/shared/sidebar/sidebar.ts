import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs/operators';

export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() userType: 'ADMIN' | 'USER' = 'USER';
  @Input() isCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  
  userName: string = 'User';
  userRole: string = 'User';
  userInitials: string = 'U';
  sidebarItems: SidebarItem[] = [];
  public currentUser: any = null;
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService
  ) {}
  ngOnInit() {
    const userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userName = user.name && user.name.trim().length > 0
          ? user.name
          : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        this.userRole = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'User';
        this.userType = (user.role === 'USER') ? 'USER' : 'ADMIN';
        this.userInitials = this.userName.split(' ').map(name => name[0]).join('').toUpperCase();
        this.sidebarItems = this.getSidebarItems(this.userType);
      } else {
        this.currentUser = null;
        this.userName = 'User';
        this.userRole = 'User';
        this.userInitials = 'U';
        this.sidebarItems = this.getSidebarItems('USER');
      }
    });
    this.subscriptions.add(userSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  getSidebarItems(type: 'ADMIN' | 'USER'): SidebarItem[] {
    if (type === 'ADMIN') {
      return [
        { label: 'Overview', icon: 'dashboard', route: '/dashboard/admin' },
        { label: 'Manage Parcels', icon: 'local_shipping', route: '/dashboard/admin/parcels' },
        { label: 'Users', icon: 'group', route: '/dashboard/admin/users' },
        { label: 'Track', icon: 'track_changes', route: '/dashboard/admin/track' },
        { label: 'Reviews', icon: 'rate_review', route: '/dashboard/admin/reviews' },
        { label: 'Contact Messages', icon: 'mail', route: '/dashboard/admin/contact-messages' },
        { label: 'Reports', icon: 'bar_chart', route: '/dashboard/admin/reports' },
      ];
    } else {
      return [
        { label: 'Overview', icon: 'dashboard', route: '/dashboard/user' },
        { label: 'My Parcels', icon: 'local_shipping', route: '/dashboard/user/parcels' },
        { label: 'Track', icon: 'track_changes', route: '/dashboard/user/track' },
        { label: 'Reviews', icon: 'rate_review', route: '/dashboard/user/reviews' },
      ];
    }
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }
}