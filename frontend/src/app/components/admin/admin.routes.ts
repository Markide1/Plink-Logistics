import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminParcelsComponent } from './parcels/admin-parcels.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminTrackingComponent } from './tracking/admin-tracking.component';
import { AdminReviewsComponent } from './reviews/admin-reviews.component';
import { AdminReportsComponent } from './reports/admin-reports.component';
import { AdminProfileComponent } from './profile/admin-profile.component';
import { AdminGuard } from '../../guards/admin.guard';
import { AdminContactMessagesComponent } from './contact-messages/contact-messages.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        component: AdminDashboardComponent
      },
      {
        path: 'parcels',
        component: AdminParcelsComponent
      },
      {
        path: 'users',
        component: AdminUsersComponent
      },
      {
        path: 'track',
        component: AdminTrackingComponent
      },
      {
        path: 'reviews',
        component: AdminReviewsComponent
      },
      {
        path: 'reports',
        component: AdminReportsComponent
      },
      {
        path: 'contact-messages',
        component: AdminContactMessagesComponent
      },
      {
        path: 'profile',
        component: AdminProfileComponent
      }
    ]
  }
];
