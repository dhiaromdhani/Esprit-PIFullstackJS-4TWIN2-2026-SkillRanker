import { Component } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../service/theme.service';

@Component({
  selector: 'app-navemp',
  templateUrl: './navemp.component.html',
  styleUrl: './navemp.component.css'
})
export class NavempComponent {
  constructor(
    public auth: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  getDashboardRoute(): string {
    const role = this.auth.getRole();
    switch (role) {
      case 'ADMINISTRATOR': return '/admin-dashboard';
      case 'MANAGER': return '/manager-dashboard';
      case 'HR_MANAGER': return '/hr-dashboard';
      case 'EMPLOYEE': return '/employee-dashboard';
      default: return '/';
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
