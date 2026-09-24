// import { TranslateService } from '@ngx-translate/core';
// import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
// import { Router } from '@angular/router';
// import { Subscription } from 'rxjs';
// import { AuthService } from '../service/auth.service';
// import { ThemeService } from '../service/theme.service';
// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html',
//   styleUrl: './header.component.css'
// })
// export class HeaderComponent {

//   //constructor(private translate: TranslateService) {}
//    theme: string = 'light';
//   private themeSub?: Subscription;

//   constructor(
//     private translate: TranslateService,
//     public auth: AuthService,
//     public themeService: ThemeService,
//     private router: Router,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit(): void {
//     this.theme = this.themeService.getCurrentTheme();
//     this.themeSub = this.themeService.theme$.subscribe((t) => {
//       this.theme = t;
//       this.cdr.markForCheck();
//     });
//   }

//   ngOnDestroy(): void {
//     this.themeSub?.unsubscribe();
//   }

//   setTheme(value: 'light' | 'dark'): void {
//     this.themeService.setTheme(value);
//   }

//   logout(): void {
//     this.auth.logout();
//     void this.router.navigate(['/']);
//   }

// }
// import { Component } from '@angular/core';
// import { ThemeService, AppTheme } from '../service/theme.service';
// import { AuthService } from '../service/auth.service';

// @Component({
//   selector: 'app-header',
//   templateUrl: './header.component.html',
//   styleUrl: './header.component.css'
// })
// export class HeaderComponent {
//   constructor(
//     public themeService: ThemeService,
//     private auth: AuthService
//   ) {}

//   setTheme(theme: AppTheme): void {
//     this.themeService.setTheme(theme);
//   }

//   isTheme(theme: AppTheme): boolean {
//     return this.themeService.getCurrentTheme() === theme;
//   }

//   getRoleCode(): string {
//     const authAny = this.auth as any;

//     const role =
//       authAny?.getRole?.() ||
//       authAny?.role ||
//       localStorage.getItem('role') ||
//       localStorage.getItem('userRole') ||
//       'USER';

//     return String(role).toUpperCase();
//   }

//   getRoleLabel(): string {
//     switch (this.getRoleCode()) {
//       case 'ADMINISTRATOR':
//       case 'ADMIN':
//         return 'navigation.adminDashboard';

//       case 'HR_MANAGER':
//       case 'HR':
//         return 'navigation.hrDashboard';

//       case 'MANAGER':
//         return 'navigation.managerDashboard';

//       case 'EMPLOYEE':
//         return 'navigation.employeeDashboard';

//       default:
//         return 'common.dashboard';
//     }
//   }

//   getRoleInitials(): string {
//     switch (this.getRoleCode()) {
//       case 'ADMINISTRATOR':
//       case 'ADMIN':
//         return 'AD';

//       case 'HR_MANAGER':
//       case 'HR':
//         return 'HR';

//       case 'MANAGER':
//         return 'MG';

//       case 'EMPLOYEE':
//         return 'EM';

//       default:
//         return 'SR';
//     }
//   }
// }
import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../service/theme.service';
import { AuthService } from '../service/auth.service';

type ThemeMode = 'light' | 'dark';

interface HeaderSearchItem {
  labelKey: string;
  descriptionKey: string;
  icon: string;
  route: string;
  roles?: string[];
  keywords: string[];
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  searchTerm = '';
  searchResults: HeaderSearchItem[] = [];
  isSearchOpen = false;

  private readonly searchItems: HeaderSearchItem[] = [
    {
      labelKey: 'navigation.adminDashboard',
      descriptionKey: 'headerSearch.adminDashboardDesc',
      icon: 'feather-grid',
      route: '/admin-dashboard',
      roles: ['ADMINISTRATOR', 'ADMIN'],
      keywords: ['admin', 'administrator', 'dashboard', 'tableau de bord', 'لوحة التحكم']
    },
    {
      labelKey: 'navigation.hrDashboard',
      descriptionKey: 'headerSearch.hrDashboardDesc',
      icon: 'feather-briefcase',
      route: '/hr-dashboard',
      roles: ['HR_MANAGER', 'HR'],
      keywords: ['hr', 'rh', 'human resources', 'resources humaines', 'dashboard', 'لوحة الموارد']
    },
    {
      labelKey: 'navigation.managerDashboard',
      descriptionKey: 'headerSearch.managerDashboardDesc',
      icon: 'feather-users',
      route: '/manager-dashboard',
      roles: ['MANAGER'],
      keywords: ['manager', 'dashboard', 'team', 'équipe', 'مدير']
    },
    {
      labelKey: 'navigation.employeeDashboard',
      descriptionKey: 'headerSearch.employeeDashboardDesc',
      icon: 'feather-user',
      route: '/employee-dashboard',
      roles: ['EMPLOYEE'],
      keywords: ['employee', 'employé', 'employe', 'dashboard', 'موظف']
    },
    {
      labelKey: 'navigation.activities',
      descriptionKey: 'headerSearch.activitiesDesc',
      icon: 'feather-calendar',
      route: '/activities',
      keywords: ['activity', 'activities', 'activité', 'activites', 'activités', 'نشاط', 'أنشطة']
    },
    {
      labelKey: 'navigation.recommendations',
      descriptionKey: 'headerSearch.recommendationsDesc',
      icon: 'feather-cpu',
      route: '/recommondation',
      keywords: ['recommendation', 'recommandation', 'ai', 'ia', 'suggestion', 'توصية']
    },
    {
      labelKey: 'navigation.profile',
      descriptionKey: 'headerSearch.profileDesc',
      icon: 'feather-user-check',
      route: '/profil',
      keywords: ['profile', 'profil', 'account', 'compte', 'ملف']
    },
    {
      labelKey: 'navigation.statistics',
      descriptionKey: 'headerSearch.statisticsDesc',
      icon: 'feather-bar-chart-2',
      route: '/stats',
      keywords: ['stats', 'statistics', 'statistiques', 'chart', 'performance', 'إحصائيات']
    },
    {
      labelKey: 'navigation.history',
      descriptionKey: 'headerSearch.historyDesc',
      icon: 'feather-clock',
      route: '/history',
      keywords: ['history', 'historique', 'archive', 'logs', 'سجل']
    },
    {
      labelKey: 'common.addEmployee',
      descriptionKey: 'headerSearch.addEmployeeDesc',
      icon: 'feather-user-plus',
      route: '/register',
      roles: ['ADMINISTRATOR', 'ADMIN', 'HR_MANAGER', 'HR'],
      keywords: ['add employee', 'ajouter employé', 'register', 'inscription', 'create user', 'إضافة موظف']
    }
  ];

  constructor(
    public themeService: ThemeService,
    private auth: AuthService,
    private router: Router
  ) {}

  setTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }

  isTheme(theme: ThemeMode): boolean {
    return this.themeService.getCurrentTheme() === theme;
  }

  getRoleCode(): string {
    const role =
      this.auth.getRole?.() ||
      localStorage.getItem('role') ||
      localStorage.getItem('userRole') ||
      'USER';

    return String(role).toUpperCase();
  }

  getRoleLabel(): string {
    switch (this.getRoleCode()) {
      case 'ADMINISTRATOR':
      case 'ADMIN':
        return 'navigation.adminDashboard';

      case 'HR_MANAGER':
      case 'HR':
        return 'navigation.hrDashboard';

      case 'MANAGER':
        return 'navigation.managerDashboard';

      case 'EMPLOYEE':
        return 'navigation.employeeDashboard';

      default:
        return 'common.dashboard';
    }
  }

  getRoleInitials(): string {
    switch (this.getRoleCode()) {
      case 'ADMINISTRATOR':
      case 'ADMIN':
        return 'AD';

      case 'HR_MANAGER':
      case 'HR':
        return 'HR';

      case 'MANAGER':
        return 'MG';

      case 'EMPLOYEE':
        return 'EM';

      default:
        return 'SR';
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.updateSearchResults();
  }

  openSearch(): void {
    this.updateSearchResults();
    this.isSearchOpen = true;
  }

  closeSearch(): void {
    setTimeout(() => {
      this.isSearchOpen = false;
    }, 120);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = this.getAllowedItems().slice(0, 6);
    this.isSearchOpen = true;
  }

  runSearch(): void {
    this.updateSearchResults();

    if (this.searchResults.length > 0) {
      this.goToSearchResult(this.searchResults[0]);
    }
  }

  goToSearchResult(item: HeaderSearchItem): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.isSearchOpen = false;
    this.router.navigate([item.route]);
  }

  trackByRoute(_: number, item: HeaderSearchItem): string {
    return item.route;
  }

  private updateSearchResults(): void {
    const term = this.normalize(this.searchTerm);

    const allowedItems = this.getAllowedItems();

    if (!term) {
      this.searchResults = allowedItems.slice(0, 6);
      this.isSearchOpen = true;
      return;
    }

    this.searchResults = allowedItems
      .map((item) => ({
        item,
        score: this.getSearchScore(item, term)
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 8);

    this.isSearchOpen = true;
  }

  private getAllowedItems(): HeaderSearchItem[] {
    const role = this.getRoleCode();

    return this.searchItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }

      return item.roles.includes(role);
    });
  }

  private getSearchScore(item: HeaderSearchItem, term: string): number {
    const values = [
      item.route,
      item.labelKey,
      item.descriptionKey,
      ...item.keywords
    ].map((value) => this.normalize(value));

    let score = 0;

    values.forEach((value) => {
      if (value === term) {
        score += 100;
      } else if (value.startsWith(term)) {
        score += 60;
      } else if (value.includes(term)) {
        score += 30;
      }
    });

    return score;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isSearchOpen = false;
  }
}