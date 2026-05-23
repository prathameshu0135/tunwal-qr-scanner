import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AdminLoginResponse } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly tokenKey = 'admin_token';
  private readonly adminKey = 'admin_user';

  private readonly tokenSignal = signal<string | null>(
    sessionStorage.getItem(this.tokenKey)
  );

  readonly isLoggedIn = computed(() => {
    return !!this.tokenSignal();
  });

  readonly token = computed(() => {
    return this.tokenSignal();
  });

  constructor(private http: HttpClient) {
    this.validateStoredToken();
  }

  login(username: string, password: string) {

    const cleanUsername = String(username || '').trim();

    return this.http
      .post<AdminLoginResponse>(
        `${environment.apiBaseUrl}/admin/login`,
        {
          username: cleanUsername,
          password
        }
      )
      .pipe(
        tap((res) => {

          if (!res?.token) {
            throw new Error('Token missing from server response');
          }

          sessionStorage.setItem(this.tokenKey, res.token);
          sessionStorage.setItem(this.adminKey, JSON.stringify(res.admin));

          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.adminKey);

          this.tokenSignal.set(res.token);
        })
      );
  }

  logout(): void {

    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.adminKey);

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);

    this.tokenSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getAdmin(): any | null {

    const raw = sessionStorage.getItem(this.adminKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {

      sessionStorage.removeItem(this.adminKey);

      return null;
    }
  }

  private validateStoredToken(): void {

    const token = sessionStorage.getItem(this.tokenKey);

    if (!token || token === 'undefined' || token === 'null') {
      this.logout();
    }
  }
}