import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials.email, credentials.password).pipe(
          map((response) => {
            // Map to expected LoginResponse format
            return AuthActions.loginSuccess({
              response: {
                access_token: response.accessToken || response.access_token || '',
                user: response.user
              }
            });
          }),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.error?.message || 'Login failed' }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ response }) => {
          // Store token in localStorage
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Navigate based on user role
          if (response.user.role === 'ADMIN') {
            this.router.navigate(['/dashboard/admin']);
          } else {
            this.router.navigate(['/home']);
          }
          
          // Show success notification
          this.notificationService.showSuccess('Login Successful', 'Welcome back!');
        })
      ),
    { dispatch: false }
  );

  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap(({ error }) => {
          this.notificationService.showError('Login Failed', error);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() => {
        // Clear localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return of(AuthActions.logoutSuccess());
      })
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          this.router.navigate(['/auth/login']);
          this.notificationService.showInfo('Logged Out', 'You have been logged out successfully');
        })
      ),
    { dispatch: false }
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUser),
      switchMap(() => {
        // Check multiple possible token keys
        const possibleTokenKeys = ['access_token', 'auth_token', 'token', 'jwt'];
        const possibleUserKeys = ['user', 'currentUser', 'auth_user'];
        
        let token = null;
        let userStr = null;
        
        // Find token
        for (const key of possibleTokenKeys) {
          const foundToken = localStorage.getItem(key);
          if (foundToken) {
            token = foundToken;
            break;
          }
        }
        
        // Find user
        for (const key of possibleUserKeys) {
          const foundUser = localStorage.getItem(key);
          if (foundUser) {
            userStr = foundUser;
            break;
          }
        }
        
        // If we have a token but no user, try to extract user from JWT
        if (token && !userStr) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const user = {
              id: payload.sub,
              email: payload.email,
              role: payload.role,
              firstName: payload.firstName || payload.email?.split('@')[0] || 'User',
              lastName: payload.lastName || ''
            };
            return of(AuthActions.loadUserSuccess({ user }));
          } catch (e) {
            // JWT parsing failed
          }
        }
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            return of(AuthActions.loadUserSuccess({ user }));
          } catch (e) {
            return of(AuthActions.loadUserFailure({ error: 'Invalid user data' }));
          }
        }
        
        return of(AuthActions.loadUserFailure({ error: 'No user data found' }));
      })
    )
  );
}
