// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class ThemeService {
//   private currentTheme = new BehaviorSubject<string>('light');
//   public theme$ = this.currentTheme.asObservable();

//   constructor() {
//     const savedTheme = this.isBrowser() ? localStorage.getItem('theme') || 'light' : 'light';
//     this.setTheme(savedTheme);
//   }

//   private isBrowser(): boolean {
//     return typeof window !== 'undefined' && typeof document !== 'undefined';
//   }

//   setTheme(theme: string) {
//     const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
//     this.currentTheme.next(normalizedTheme);

//     if (!this.isBrowser()) return;

//     localStorage.setItem('theme', normalizedTheme);
//     document.body.classList.remove('light', 'dark', 'theme-light', 'theme-dark', 'dark-mode');
//     document.documentElement.classList.remove('theme-light', 'theme-dark');
//     document.body.classList.add(normalizedTheme, `theme-${normalizedTheme}`);
//     document.documentElement.classList.add(`theme-${normalizedTheme}`);
//   }

//   toggleTheme() {
//     const newTheme = this.currentTheme.value === 'light' ? 'dark' : 'light';
//     this.setTheme(newTheme);
//   }

//   getCurrentTheme(): string {
//     return this.currentTheme.value;
//   }
// }
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<AppTheme>('dark');
  theme$ = this.themeSubject.asObservable();

  constructor() {
    const savedTheme = this.isBrowser()
      ? (localStorage.getItem('theme') as AppTheme | null)
      : null;

    this.setTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark');
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  setTheme(theme: AppTheme): void {
    this.themeSubject.next(theme);

    if (!this.isBrowser()) return;

    localStorage.setItem('theme', theme);

    document.documentElement.classList.remove('theme-light', 'theme-dark', 'light', 'dark');
    document.body.classList.remove('theme-light', 'theme-dark', 'light', 'dark', 'dark-mode', 'light-mode');

    document.documentElement.classList.add(`theme-${theme}`, theme);
    document.body.classList.add(`theme-${theme}`, theme);
  }

  toggleTheme(): void {
    this.setTheme(this.themeSubject.value === 'dark' ? 'light' : 'dark');
  }

  getCurrentTheme(): AppTheme {
    return this.themeSubject.value;
  }
}