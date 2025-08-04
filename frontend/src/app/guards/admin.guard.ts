import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    }

    // If authenticated but not admin, redirect to user dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard/user']);
      return false;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
