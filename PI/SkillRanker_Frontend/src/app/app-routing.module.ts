import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterComponent } from './register/register.component';
import { RecommendationComponent } from './pages/recommendation/recommendation.component';
import { MANAGERDashboardComponent } from './pages/managerdashboard/managerdashboard.component';
import { HrDashboardComponent } from './hr-dashboard/hr-dashboard.component';
import { EmployeDashboardComponent } from './pages/employe-dashboard/employe-dashboard.component';
import { StatsComponent } from './stats/stats.component';
import { ProfilComponent } from './profil/profil.component';
import { ActiviteComponent } from './activite/activite.component';
import { FicheComponent } from './fiche/fiche.component';
import { QuestionCompetenceComponent } from './question-competence/question-competence.component';
import { CompetenceComponent } from './competence/competence.component';
import { ActivteEmloyeeComponent } from './activte-emloyee/activte-emloyee.component';
import { OAuthSuccessComponent } from './oauth-success/oauth-success.component';
import { ChatboatRecommondationComponent } from './chatboat-recommondation/chatboat-recommondation.component';
import { LanguageSelectorComponent } from './language-selector/language-selector.component';
import { HistoryComponent } from './history/history.component';
import { ProfilemployeComponent } from './profilemploye/profilemploye.component';

const routes: Routes = [
   { path: '', component: LoginComponent },
   { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
     { path: 'recommondation', component: RecommendationComponent },
  { path: 'admin-dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { role: 'ADMINISTRATOR' } },
   { path: 'manager-dashboard', component: MANAGERDashboardComponent, canActivate: [AuthGuard] , data: { role: 'MANAGER' } },
    { path: 'hr-dashboard', component: HrDashboardComponent, canActivate: [AuthGuard] , data: { role: 'HR_MANAGER' }},
     { path: 'employee-dashboard', component: EmployeDashboardComponent, canActivate: [AuthGuard]  ,data: { role: 'EMPLOYEE' }},
     {
  path: 'profile',
  component: ProfilComponent
},
  {
  path: 'profileemployee',
  component: ProfilemployeComponent
},
    {
  path: 'activities',
  component: ActiviteComponent
},     { path: 'fiche', component: FicheComponent },
 { path: 'activitiesEmpl', component: ActivteEmloyeeComponent },
 { path: 'question', component: QuestionCompetenceComponent },
  { path: 'competence', component: CompetenceComponent },
  { path: 'oauth-success', component: OAuthSuccessComponent },
  { path: 'chatrecommendation', component: ChatboatRecommondationComponent },

{ path: 'lg', component: LanguageSelectorComponent },
 { path: 'history', component: HistoryComponent, canActivate: [AuthGuard], data: { role: ['HR_MANAGER', 'MANAGER', 'ADMINISTRATOR'] } },


    {
  path: 'stats',
  component: StatsComponent,
  canActivate: [AuthGuard], data: { role: ['HR_MANAGER', 'MANAGER'] }
},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
