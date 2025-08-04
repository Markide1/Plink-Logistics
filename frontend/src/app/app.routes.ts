import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Track } from './pages/track/track';
import { Contact } from './pages/contact/contact';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminContactMessagesComponent } from './components/admin/contact-messages/contact-messages.component';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'about', component: About },
  { path: 'track', component: Track },
  { path: 'contact', component: Contact },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'auth/verify-email',
    loadComponent: () => import('./auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  { 
    path: 'dashboard',
    canActivate: [AuthGuard],
    children: [
      { 
        path: 'user', 
        canActivate: [AuthGuard],
        loadChildren: () => import('./components/user/user.routes').then(m => m.userRoutes)
      },
      { 
        path: 'admin', 
        canActivate: [AdminGuard],
        loadChildren: () => import('./components/admin/admin.routes').then(m => m.adminRoutes)
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
