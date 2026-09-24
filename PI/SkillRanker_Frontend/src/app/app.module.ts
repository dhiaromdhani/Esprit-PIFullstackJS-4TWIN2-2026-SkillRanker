import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './service/auth.interceptor';
import { OAuthSuccessComponent } from './oauth-success/oauth-success.component';
import { RegisterComponent } from './register/register.component';
import { NavbarComponent } from './navbar/navbar.component';
import { HeaderComponent } from './header/header.component';
import { RecommendationComponent } from './pages/recommendation/recommendation.component';
import { HrDashboardComponent } from './hr-dashboard/hr-dashboard.component';
import { EmployeDashboardComponent } from './pages/employe-dashboard/employe-dashboard.component';
import { MANAGERDashboardComponent } from './pages/managerdashboard/managerdashboard.component';
import { ProfilComponent } from './profil/profil.component';
import { ActiviteComponent } from './activite/activite.component';
import { StatsComponent } from './stats/stats.component';
import { HistoryComponent } from './history/history.component';
import { FicheComponent } from './fiche/fiche.component';
import { QuestionCompetenceComponent } from './question-competence/question-competence.component';
import { CompetenceComponent } from './competence/competence.component';
import { NavempComponent } from './navemp/navemp.component';
import { ActivteEmloyeeComponent } from './activte-emloyee/activte-emloyee.component';
import { ChatboatRecommondationComponent } from './chatboat-recommondation/chatboat-recommondation.component';
import { LanguageSelectorComponent } from './language-selector/language-selector.component';
import { LanguageService } from './service/language.service';
import { AccessibilityService } from './service/accessibility.service';
import { ProfilemployeComponent } from './profilemploye/profilemploye.component';
import { HeaderHrComponent } from './header-hr/header-hr.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function initializeApp(languageService: LanguageService, accessibilityService: AccessibilityService) {
  return () => {
    languageService.getCurrentLanguage();
    accessibilityService.getSettings();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    OAuthSuccessComponent,
    RegisterComponent,
    NavbarComponent,
    HeaderComponent,
    RecommendationComponent,
    HrDashboardComponent,
    EmployeDashboardComponent,
    MANAGERDashboardComponent,
    ProfilComponent,
    ActiviteComponent,
    StatsComponent,
    HistoryComponent,
    FicheComponent,
    QuestionCompetenceComponent,
    CompetenceComponent,
    NavempComponent,
    ActivteEmloyeeComponent,
    ChatboatRecommondationComponent,
    LanguageSelectorComponent,
    ProfilemployeComponent,
    HeaderHrComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    provideClientHydration(),
    LanguageService,
    AccessibilityService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [LanguageService, AccessibilityService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }