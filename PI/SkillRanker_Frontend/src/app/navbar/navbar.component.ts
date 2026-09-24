import { Component } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../service/theme.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
 constructor(
    public auth: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private translate: TranslateService
  ) {}
 getDashboardRoute(): string {
    const role = this.auth.getRole();
    switch (role) {
      case 'ADMINISTRATOR': return '/admin-dashboard';
      case 'MANAGER': return '/manager-dashboard';
      case 'HR_MANAGER': return '/hr-dashboard';
      case 'EMPLOYEE': return '/employee-dashboard';
      default: return '/login';
    }
  }
  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
