// import { Component } from '@angular/core';
// import { AuthService } from '../service/auth.service';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.css'
// })
// export class LoginComponent {

//   email = '';
//   password = '';
//   error = '';

//   constructor(private auth: AuthService, private router: Router) {}

//   login() {
//     this.auth.login({ email: this.email, password: this.password })
//       .subscribe({
//         next: () => this.router.navigate(['/dashboard']),
//         error: () => this.error = 'Email ou mot de passe incorrect'
//       });
//   }
//   loginWithGoogle() {
//   window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
// }
// }
/*import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // fix typo: styleUrl → styleUrls
})
export class LoginComponent implements OnInit {

  email = '';
  password = '';
  error = '';

  /*constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
     @Inject(PLATFORM_ID) private platformId: Object
  ) {}*/
 //constructor(private auth: AuthService, private router: Router) {}

  // ngOnInit() {
  //   // Check for Google OAuth token in URL
  //   this.route.queryParams.subscribe(params => {
  //     const token = params['token'];
  //     if (token) {
  //       // Save token in sessionStorage
  //       sessionStorage.setItem('accessToken', token);

  //       // Redirect to dashboard
  //       this.router.navigate(['/dashboard'], { replaceUrl: true });
  //     }
  //   });
  // }
 /* ngOnInit() {
  // this.route.queryParams.subscribe(params => {
  //   const token = params['token'];

  //   if (token && isPlatformBrowser(this.platformId)) {
  //     sessionStorage.setItem('accessToken', token);
  //     this.router.navigate(['/employee-dashboard'], { replaceUrl: true });
  //   }
  // });
}

 /* login() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.error = 'Email ou mot de passe incorrect'
      });
  }*/
 /*login() {
  this.auth.login({ email: this.email, password: this.password })
    .subscribe({
      next: () => {
        const role = this.auth.getRole();

        switch (role) {
          case 'ADMINISTRATOR':
            this.router.navigate(['/admin-dashboard']);
            break;

          case 'MANAGER':
            this.router.navigate(['/manager-dashboard']);
            break;

          case 'HR_MANAGER':
            this.router.navigate(['/hr-dashboard']);
            break;

          default:
            this.router.navigate(['/employee-dashboard']);
        }
      },
      error: () => this.error = 'Email ou mot de passe incorrect'
    });
}*/
/*login() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          const role = this.auth.getRole();

          switch (role) {
            case 'ADMINISTRATOR':
              this.router.navigate(['/admin-dashboard']);
              break;

            case 'MANAGER':
              this.router.navigate(['/manager-dashboard']);
              break;

            case 'HR_MANAGER':
              this.router.navigate(['/hr-dashboard']);
              break;

            case 'EMPLOYEE':
              this.router.navigate(['/employee-dashboard']);
              break;

            default:
              this.router.navigate(['/employee-dashboard']);
          }
        },
        error: () => {
          this.error = 'Email ou mot de passe incorrect';
        }
      });
  }


  loginWithGoogle() {
    window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
  }
}*/
// import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
// import { AuthService } from '../service/auth.service';
// import { Router, ActivatedRoute } from '@angular/router';
// import { isPlatformBrowser } from '@angular/common';
// import { jwtDecode } from 'jwt-decode';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent implements OnInit {

//   email = '';
//   password = '';
//   error = '';

//   constructor(
//     private auth: AuthService,
//     private router: Router,
//     private route: ActivatedRoute,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   ngOnInit() {
//     if (!isPlatformBrowser(this.platformId)) return;

//     this.route.queryParams.subscribe(params => {
//       const token = params['token'];

//       if (token) {
//         sessionStorage.setItem('accessToken', token);

//         // decode JWT
//         const payload: any = jwtDecode(token);
//         sessionStorage.setItem('role', payload.role);
//         sessionStorage.setItem('userId', payload.id);

//         // 🚀 direct employee dashboard
//         this.router.navigate(['/employee-dashboard'], { replaceUrl: true });
//       }
//     });
//   }

//   login() {
//     this.auth.login({ email: this.email, password: this.password })
//       .subscribe({
//         next: () => {
//           const role = this.auth.getRole();

//           switch (role) {
//             case 'ADMINISTRATOR':
//               this.router.navigate(['/admin-dashboard']);
//               break;
//             case 'MANAGER':
//               this.router.navigate(['/manager-dashboard']);
//               break;
//             case 'HR_MANAGER':
//               this.router.navigate(['/hr-dashboard']);
//               break;
//             default:
//               this.router.navigate(['/employee-dashboard']);
//           }
//         },
//         error: () => {
//           this.error = 'Email ou mot de passe incorrect';
//         }
//       });
//   }

//   loginWithGoogle() {
//     window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
//   }

//   loginWithGithub() {
//     window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/github';
//   }

//   loginWithLinkedin() {
//     window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/linkedin';
//   }
// }

// import { Component } from '@angular/core';
// import { AuthService } from '../service/auth.service';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.css'
// })
// export class LoginComponent {

//   email = '';
//   password = '';
//   error = '';

//   constructor(private auth: AuthService, private router: Router) {}

//   login() {
//     this.auth.login({ email: this.email, password: this.password })
//       .subscribe({
//         next: () => this.router.navigate(['/dashboard']),
//         error: () => this.error = 'Email ou mot de passe incorrect'
//       });
//   }
//   loginWithGoogle() {
//   window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
// }
// }
/*import { Component, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // fix typo: styleUrl → styleUrls
})
export class LoginComponent implements OnInit {

  email = '';
  password = '';
  error = '';

  /*constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
     @Inject(PLATFORM_ID) private platformId: Object
  ) {}*/
 //constructor(private auth: AuthService, private router: Router) {}

  // ngOnInit() {
  //   // Check for Google OAuth token in URL
  //   this.route.queryParams.subscribe(params => {
  //     const token = params['token'];
  //     if (token) {
  //       // Save token in sessionStorage
  //       sessionStorage.setItem('accessToken', token);

  //       // Redirect to dashboard
  //       this.router.navigate(['/dashboard'], { replaceUrl: true });
  //     }
  //   });
  // }
 /* ngOnInit() {
  // this.route.queryParams.subscribe(params => {
  //   const token = params['token'];

  //   if (token && isPlatformBrowser(this.platformId)) {
  //     sessionStorage.setItem('accessToken', token);
  //     this.router.navigate(['/employee-dashboard'], { replaceUrl: true });
  //   }
  // });
}

 /* login() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.error = 'Email ou mot de passe incorrect'
      });
  }*/
 /*login() {
  this.auth.login({ email: this.email, password: this.password })
    .subscribe({
      next: () => {
        const role = this.auth.getRole();

        switch (role) {
          case 'ADMINISTRATOR':
            this.router.navigate(['/admin-dashboard']);
            break;

          case 'MANAGER':
            this.router.navigate(['/manager-dashboard']);
            break;

          case 'HR_MANAGER':
            this.router.navigate(['/hr-dashboard']);
            break;

          default:
            this.router.navigate(['/employee-dashboard']);
        }
      },
      error: () => this.error = 'Email ou mot de passe incorrect'
    });
}*/
/*login() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          const role = this.auth.getRole();

          switch (role) {
            case 'ADMINISTRATOR':
              this.router.navigate(['/admin-dashboard']);
              break;

            case 'MANAGER':
              this.router.navigate(['/manager-dashboard']);
              break;

            case 'HR_MANAGER':
              this.router.navigate(['/hr-dashboard']);
              break;

            case 'EMPLOYEE':
              this.router.navigate(['/employee-dashboard']);
              break;

            default:
              this.router.navigate(['/employee-dashboard']);
          }
        },
        error: () => {
          this.error = 'Email ou mot de passe incorrect';
        }
      });
  }


  loginWithGoogle() {
    window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
  }
}*/
// import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
// import { Subscription } from 'rxjs';
// import { AuthService } from '../service/auth.service';
// import { Router, ActivatedRoute } from '@angular/router';
// import { isPlatformBrowser } from '@angular/common';
// import { jwtDecode } from 'jwt-decode';
// import { HttpErrorResponse } from '@angular/common/http';
// import { finalize } from 'rxjs';
// import { ThemeService } from '../service/theme.service';

// const AUTH_BODY_CLASS = 'auth-route';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent implements OnInit, OnDestroy {

//   email = '';
//   password = '';
//   error = '';
//   /** After registration redirect */
//   infoMessage = '';
//   isSubmitting = false;
//   /** Synced with ThemeService (light / dark). */
//   themeMode: 'light' | 'dark' = 'light';
//   private themeSub?: Subscription;
//   private previousBodyOverflow = '';
//   private previousBodyHeight = '';

//   constructor(
//     private auth: AuthService,
//     private router: Router,
//     private route: ActivatedRoute,
//     private theme: ThemeService,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   ngOnInit() {
//     if (!isPlatformBrowser(this.platformId)) return;

//     document.body.classList.add(AUTH_BODY_CLASS);
//     this.previousBodyOverflow = document.body.style.overflow;
//     this.previousBodyHeight = document.body.style.height;
//     document.body.style.overflow = 'hidden';
//     document.body.style.height = '100dvh';
//     this.theme.setTheme(this.theme.getCurrentTheme());
//     this.themeMode = this.theme.getCurrentTheme() === 'dark' ? 'dark' : 'light';
//     this.themeSub = this.theme.theme$.subscribe((t) => {
//       this.themeMode = t === 'dark' ? 'dark' : 'light';
//     });

//     this.route.queryParams.subscribe(params => {
//       const token = params['token'];

//       if (token) {
//         sessionStorage.setItem('accessToken', token);

//         // decode JWT
//         const payload: any = jwtDecode(token);
//         sessionStorage.setItem('role', payload.role);
//         sessionStorage.setItem('userId', payload.id);

//         // 🚀 direct employee dashboard
//         this.router.navigate(['/employee-dashboard'], { replaceUrl: true });
//         return;
//       }

//       if (params['registered'] === '1') {
//         this.infoMessage = 'Your account was created. Sign in with your email and password.';
//         this.router.navigate([], {
//           relativeTo: this.route,
//           queryParams: { registered: null },
//           queryParamsHandling: 'merge',
//           replaceUrl: true,
//         });
//       }
//     });
//   }

//   ngOnDestroy(): void {
//     this.themeSub?.unsubscribe();
//     if (isPlatformBrowser(this.platformId)) {
//       document.body.classList.remove(AUTH_BODY_CLASS);
//       document.body.style.overflow = this.previousBodyOverflow;
//       document.body.style.height = this.previousBodyHeight;
//     }
//   }

//   setThemeMode(mode: 'light' | 'dark'): void {
//     this.theme.setTheme(mode);
//   }

//   login() {
//     if (this.isSubmitting) {
//       return;
//     }
//     this.error = '';
//     this.infoMessage = '';
//     this.isSubmitting = true;
//     this.auth.login({ email: this.email, password: this.password })
//       .pipe(finalize(() => { this.isSubmitting = false; }))
//       .subscribe({
//         next: () => {
//           const role = this.auth.getRole();

//           switch (role) {
//             case 'ADMINISTRATOR':
//               this.router.navigate(['/admin-dashboard']);
//               break;
//             case 'MANAGER':
//               this.router.navigate(['/manager-dashboard']);
//               break;
//             case 'HR_MANAGER':
//               this.router.navigate(['/hr-dashboard']);
//               break;
//             default:
//               this.router.navigate(['/employee-dashboard']);
//           }
//         },
//         error: (err: unknown) => {
//           this.error = this.formatLoginError(err);
//         }
//       });
//   }

//   private formatLoginError(err: unknown): string {
//     if (err instanceof HttpErrorResponse) {
//       if (err.status === 0) {
//         return 'Cannot reach the server. Start the backend (port 3000) and check your network.';
//       }
//       if (err.status === 401) {
//         const body = err.error;
//         if (typeof body === 'object' && body && 'message' in body) {
//           return String((body as { message: string }).message);
//         }
//         return 'Email ou mot de passe incorrect';
//       }
//       const body = err.error;
//       if (typeof body === 'object' && body && 'message' in body) {
//         return String((body as { message: string }).message);
//       }
//       return `Sign-in failed (${err.status}). Please try again.`;
//     }
//     if (err instanceof Error && err.message) {
//       return err.message;
//     }
//     return 'Sign-in failed. Please try again.';
//   }

//   loginWithGoogle() {
//     window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
//   }

//   loginWithGithub() {
//     window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/github';
//   }

//   loginWithLinkedin() {
//     window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/linkedin';
//   }
// }
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { AuthService } from '../service/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { HttpErrorResponse } from '@angular/common/http';
import { ThemeService } from '../service/theme.service';
import { LanguageService } from '../service/language.service';

const AUTH_BODY_CLASS = 'auth-route';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  email = '';
  password = '';

  error = '';
  infoMessage = '';
  isSubmitting = false;

  themeMode: 'light' | 'dark' = 'light';

  private themeSub?: Subscription;
  private previousBodyOverflow = '';
  private previousBodyHeight = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private theme: ThemeService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.languageService.setLanguage(this.languageService.getCurrentLanguage());

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.body.classList.add(AUTH_BODY_CLASS);

    this.previousBodyOverflow = document.body.style.overflow;
    this.previousBodyHeight = document.body.style.height;

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100dvh';

    this.theme.setTheme(this.theme.getCurrentTheme());
    this.themeMode = this.theme.getCurrentTheme() === 'dark' ? 'dark' : 'light';

    this.themeSub = this.theme.theme$.subscribe((theme) => {
      this.themeMode = theme === 'dark' ? 'dark' : 'light';
    });

    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        sessionStorage.setItem('accessToken', token);

        const payload: any = jwtDecode(token);

        sessionStorage.setItem('role', payload.role);
        sessionStorage.setItem('userId', payload.id);

        this.router.navigate(['/employee-dashboard'], { replaceUrl: true });
        return;
      }

      if (params['registered'] === '1') {
        this.infoMessage = 'login.registeredSuccess';

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { registered: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();

    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove(AUTH_BODY_CLASS);
      document.body.style.overflow = this.previousBodyOverflow;
      document.body.style.height = this.previousBodyHeight;
    }
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    this.themeMode = mode;
    this.theme.setTheme(mode);
  }

  login(): void {
    if (this.isSubmitting) {
      return;
    }

    this.error = '';
    this.infoMessage = '';

    if (!this.email || !this.password) {
      this.error = 'login.requiredFields';
      return;
    }

    this.isSubmitting = true;

    this.auth.login({
      email: this.email.trim(),
      password: this.password
    })
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          const role = this.auth.getRole();

          switch (role) {
            case 'ADMINISTRATOR':
              this.router.navigate(['/admin-dashboard']);
              break;

            case 'MANAGER':
              this.router.navigate(['/manager-dashboard']);
              break;

            case 'HR_MANAGER':
              this.router.navigate(['/hr-dashboard']);
              break;

            default:
              this.router.navigate(['/employee-dashboard']);
          }
        },
        error: (err: unknown) => {
          this.error = this.formatLoginError(err);
        }
      });
  }

  private formatLoginError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'login.serverUnavailable';
      }

      if (err.status === 401 || err.status === 403) {
        return 'login.invalidCredentials';
      }

      const body = err.error;

      if (typeof body === 'object' && body && 'message' in body) {
        return String((body as { message: string }).message);
      }

      return 'login.signInFailed';
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return 'login.signInFailed';
  }

  loginWithGoogle(): void {
    if (!isPlatformBrowser(this.platformId) || this.isSubmitting) {
      return;
    }

    window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
  }

  loginWithGithub(): void {
    if (!isPlatformBrowser(this.platformId) || this.isSubmitting) {
      return;
    }

    window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/github';
  }

  loginWithLinkedin(): void {
    if (!isPlatformBrowser(this.platformId) || this.isSubmitting) {
      return;
    }

    window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/linkedin';
  }
}



