import { AuthState } from './auth/auth.models';

export interface AppState {
  auth: AuthState;
}

export const reducers = {
  auth: () => import('./auth/auth.reducer').then(m => m.authReducer)
};

export const effects = [
  () => import('./auth/auth.effects').then(m => m.AuthEffects)
];
