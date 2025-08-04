import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Check multiple possible token keys
  const possibleKeys = ['access_token', 'auth_token', 'token', 'jwt'];
  let token = null;
  
  for (const key of possibleKeys) {
    const foundToken = localStorage.getItem(key);
    if (foundToken) {
      token = foundToken;
      break;
    }
  }
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};
