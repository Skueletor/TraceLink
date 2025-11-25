import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Simple token getters
function getAccessToken(): string | null {
  return localStorage.getItem('trace_token');
}
function getRefreshToken(): string | null {
  return localStorage.getItem('trace_refresh');
}

// Attempt refresh (placeholder hitting /auth/refresh)
function performRefresh(refreshToken: string): Observable<string | null> {
  return new Observable(observer => {
    fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        if (data?.token) {
          localStorage.setItem('trace_token', data.token);
          observer.next(data.token);
        } else {
          observer.next(null);
        }
        observer.complete();
      })
      .catch(() => { observer.next(null); observer.complete(); });
  });
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const access = getAccessToken();
  let authReq = req;
  if (access) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${access}` } });
  }
  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401) {
        const refresh = getRefreshToken();
        if (refresh) {
          return performRefresh(refresh).pipe(
            switchMap(newToken => {
              if (newToken) {
                const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
                return next(retried);
              }
              return throwError(() => err);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};
