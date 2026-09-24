/*import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
*/
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    const expectedRoles = route.data['role'];
    const userRole = this.auth.getRole();

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // If expectedRoles is an array, check if user role is in the array
    if (expectedRoles) {
      if (Array.isArray(expectedRoles)) {
        if (!expectedRoles.includes(userRole)) {
          this.router.navigate(['/login']);
          return false;
        }
      } else {
        // Single role check
        if (userRole !== expectedRoles) {
          this.router.navigate(['/login']);
          return false;
        }
      }
    }

    return true;
  }
}