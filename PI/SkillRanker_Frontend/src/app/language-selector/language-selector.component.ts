// import { Component, OnInit } from '@angular/core';
// import { LanguageService } from '../service/language.service';
// import { AccessibilityService, AccessibilitySettings } from '../service/accessibility.service';
// import { Observable } from 'rxjs';

// @Component({
//   selector: 'app-language-selector',
//   templateUrl: './language-selector.component.html',
//   styleUrls: ['./language-selector.component.css']
// })
// export class LanguageSelectorComponent implements OnInit {
//   languages: { code: string; name: string; nativeName: string }[] = [];
//   currentLanguage$: Observable<string>;
//   showMenu = false;
//   showAccessibilityPanel = false;
//   accessibilitySettings$: Observable<AccessibilitySettings>;
//   currentSettings: AccessibilitySettings | null = null;

//   fontSizes = [
//     { value: 'small', label: 'Small', multiplier: 0.85 },
//     { value: 'medium', label: 'Medium', multiplier: 1 },
//     { value: 'large', label: 'Large', multiplier: 1.2 },
//     { value: 'extraLarge', label: 'Extra Large', multiplier: 1.5 }
//   ];

//   constructor(
//     private languageService: LanguageService,
//     private accessibilityService: AccessibilityService
//   ) {
//     this.currentLanguage$ = this.languageService.currentLanguage$;
//     this.accessibilitySettings$ = this.accessibilityService.settings$;
//   }

//   ngOnInit(): void {
//     this.languages = this.languageService.getLanguages();
//     this.accessibilitySettings$.subscribe(settings => {
//       this.currentSettings = settings;
//     });
//   }

//   changeLanguage(langCode: string): void {
//     this.languageService.setLanguage(langCode);
//     this.showMenu = false;
//   }

//   toggleMenu(): void {
//     this.showMenu = !this.showMenu;
//   }

//   toggleAccessibilityPanel(): void {
//     this.showAccessibilityPanel = !this.showAccessibilityPanel;
//   }

//   updateFontSize(size: string): void {
//     this.accessibilityService.setFontSize(size as 'small' | 'medium' | 'large' | 'extraLarge');
//   }

//   toggleHighContrast(): void {
//     if (this.currentSettings) {
//       if (this.currentSettings.highContrast) {
//         this.accessibilityService.disableHighContrast();
//       } else {
//         this.accessibilityService.enableHighContrast();
//       }
//     }
//   }

//   toggleTextToSpeech(): void {
//     if (this.currentSettings) {
//       if (this.currentSettings.textToSpeech) {
//         this.accessibilityService.disableTextToSpeech();
//       } else {
//         this.accessibilityService.enableTextToSpeech();
//       }
//     }
//   }

//   resetAccessibility(): void {
//     this.accessibilityService.resetToDefaults();
//     this.accessibilityService.announce('Accessibility settings reset to defaults');
//   }

//   closeMenu(): void {
//     this.showMenu = false;
//     this.showAccessibilityPanel = false;
//   }
// }
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LanguageService, AppLanguage } from '../service/language.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.css'
})
export class LanguageSelectorComponent implements OnInit {
  languages: { code: AppLanguage; label: string; name: string }[] = [];
  currentLanguage$!: Observable<AppLanguage>;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.languages = this.languageService.languages;
    this.currentLanguage$ = this.languageService.currentLanguage$;
  }

  changeLanguage(lang: AppLanguage): void {
    this.languageService.setLanguage(lang);
  }
}
