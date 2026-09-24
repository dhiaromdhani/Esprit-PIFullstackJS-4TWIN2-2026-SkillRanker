import { Component } from '@angular/core';
import { ThemeService } from './service/theme.service';
import { LanguageService } from './service/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontendv2';

  // constructor(private themeService: ThemeService) {
  //   this.themeService.setTheme(this.themeService.getCurrentTheme());
  // }
   constructor(
    private themeService: ThemeService,
    private languageService: LanguageService
  ) {
    this.themeService.setTheme(this.themeService.getCurrentTheme());
    this.languageService.setLanguage(this.languageService.getCurrentLanguage());
  }
}
