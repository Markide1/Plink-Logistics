import { Routes } from '@angular/router';
import { UserLayoutComponent } from './user-layout.component';
import { UserParcelsComponent } from './parcels/user-parcels.component';
import { UserTrackingComponent } from './tracking/user-tracking.component';
import { UserReviewsComponent } from './reviews/user-reviews.component';
import { UserProfileComponent } from './profile/user-profile.component';
import { UserDashboardComponent } from './dashboard/user-dashboard.component';
import { AuthGuard } from '../../guards/auth.guard';

export const userRoutes: Routes = [
  { 
    path: '', 
    component: UserLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: UserDashboardComponent },
      { path: 'parcels', component: UserParcelsComponent },
      { path: 'track', component: UserTrackingComponent },
      { path: 'reviews', component: UserReviewsComponent },
      { path: 'profile', component: UserProfileComponent }
    ]
  }
];
