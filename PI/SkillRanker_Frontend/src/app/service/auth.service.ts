// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { tap } from 'rxjs/operators';

// @Injectable({ providedIn: 'root' })
// export class AuthService {

//   private API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth';

//   constructor(private http: HttpClient) {}

//   login(data: { email: string; password: string }) {
//     return this.http.post<any>(`${this.API}/login`, data).pipe(
//       tap(res => {
//         sessionStorage.setItem('accessToken', res.accessToken);
//         sessionStorage.setItem('refreshToken', res.refreshToken);
//       })
//     );
//   }

//   logout() {
//     const refreshToken = sessionStorage.getItem('refreshToken');
//     sessionStorage.clear();
//     return this.http.post(`${this.API}/logout`, { refreshToken });
//   }

//   getToken() {
//     return sessionStorage.getItem('accessToken');
//   }

//   isLoggedIn(): boolean {
//     return !!this.getToken();
//   }
// }
/*import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${this.API}/login`, data).pipe(
      tap(res => {
        if (this.isBrowser) {
          sessionStorage.setItem('accessToken', res.accessToken);
          sessionStorage.setItem('refreshToken', res.refreshToken);
          sessionStorage.setItem('role', res.user.role);
        }
      })
    );
  }

  logout() {
    let refreshToken: string | null = null;

    if (this.isBrowser) {
      refreshToken = sessionStorage.getItem('refreshToken');
      sessionStorage.clear();
    }

    return this.http.post(`${this.API}/logout`, { refreshToken });
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return sessionStorage.getItem('accessToken');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
  if (this.isBrowser) {
    return sessionStorage.getItem('role');
  }
  return null;
}
hasRole(expectedRole: string): boolean {
  return this.getRole() === expectedRole;
}
}*/



/* athya yekhdem
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${this.API}/login`, data).pipe(
      tap(res => {
        if (this.isBrowser) {
          const token = res.accessToken;

          sessionStorage.setItem('accessToken', token);
          sessionStorage.setItem('refreshToken', res.refreshToken);

          // ✅ Decode JWT
          const payload = JSON.parse(atob(token.split('.')[1]));
          sessionStorage.setItem('role', payload.role);
        }
      })
    );
  }

  getToken(): string | null {
    return this.isBrowser ? sessionStorage.getItem('accessToken') : null;
  }

  getRole(): string | null {
    return this.isBrowser ? sessionStorage.getItem('role') : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    if (this.isBrowser) {
      sessionStorage.clear();
    }
  }
}*/

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${this.API}/login`, data).pipe(
      tap(res => {
        if (!this.isBrowser) return;

        sessionStorage.setItem('accessToken', res.accessToken);
        sessionStorage.setItem('refreshToken', res.refreshToken);

        const payload: any = jwtDecode(res.accessToken);
        sessionStorage.setItem('role', payload.role);
        sessionStorage.setItem('userId', payload.id);
      })
    );
  }

  getToken(): string | null {
    return this.isBrowser ? sessionStorage.getItem('accessToken') : null;
  }

  getRole(): string | null {
    return this.isBrowser ? sessionStorage.getItem('role') : null;
  }

  getUserId(): string | null {
    return this.isBrowser ? sessionStorage.getItem('userId') : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    if (!this.isBrowser) return;

    const refreshToken = sessionStorage.getItem('refreshToken');

    this.http.post(`${this.API}/logout`, { refreshToken })
      .subscribe({
        next: () => sessionStorage.clear(),
        error: () => sessionStorage.clear()
      });
  }
}