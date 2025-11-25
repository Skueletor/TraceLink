import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'trace_token';
  private refreshKey = 'trace_refresh';
  private userKey = 'trace_user';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<{ token: string; refreshToken: string; user: User }> {
    return this.http.post<{ token: string; refreshToken: string; user: User }>(`${environment.api}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.refreshKey, res.refreshToken);
        localStorage.setItem(this.userKey, JSON.stringify(res.user));
      })
    );
  }

  register(data: { name: string; email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${environment.api}/auth/register`, data);
  }

  logout(): void {
    const refresh = localStorage.getItem(this.refreshKey);
    if (refresh) {
      this.http.post(`${environment.api}/auth/logout`, { refreshToken: refresh }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.userKey);
  }
  
  getMe(): Observable<{ id: number; name: string; email: string; role: string }> {
    return this.http.get<{ id: number; name: string; email: string; role: string }>(`${environment.api}/auth/me`).pipe(
      tap(user => {
        // Optionally persist user name for quick access (avoid storing sensitive data)
        localStorage.setItem('user_name', user.name);
        localStorage.setItem('user_email', user.email);
      })
    );
  }

  refresh(): Observable<string | null> {
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!refreshToken) return of(null);
    return this.http.post<{ token: string }>(`${environment.api}/auth/refresh`, { refreshToken }).pipe(
      tap(res => {
        if (res.token) localStorage.setItem(this.tokenKey, res.token);
      }),
      map(res => res.token || null)
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  currentUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }
}
