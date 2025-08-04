import { createReducer, on } from '@ngrx/store';
import { AuthState, initialAuthState } from './auth.models';
import * as AuthActions from './auth.actions';

export const authReducer = createReducer(
  initialAuthState,
  
  // Login Actions
  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { response }) => ({
    ...state,
    user: response.user,
    token: response.access_token,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error
  })),
  
  // Logout Actions
  on(AuthActions.logout, (state) => ({
    ...state,
    isLoading: true
  })),
  
  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState
  })),
  
  // Load User Actions
  on(AuthActions.loadUser, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  
  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    token: localStorage.getItem('access_token'),
    isAuthenticated: true,
    isLoading: false,
    error: null
  })),
  
  on(AuthActions.loadUserFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  
  // Clear Error
  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null
  }))
);
