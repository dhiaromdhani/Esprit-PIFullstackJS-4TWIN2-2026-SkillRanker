import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecommendationService } from '../../service/recommendation.service';
import { NotificationService } from '../../service/notification.service';
import { ActivityService, Activity } from '../../service/activity.service';
import { VocalService } from '../../service/vocal.service';

@Component({
  selector: 'app-recommendation',
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.css']
})
export class RecommendationComponent implements OnInit {
  activityId = '';
  activity: Activity | null = null;

  prompt = '';
  results: any[] = [];

  loading = false;
  searched = false;
  loadError = '';

  confirming = false;
  confirmed = false;
  confirmMsg = '';
  confirmError = '';

  meta: any = null;

  constructor(
    private route: ActivatedRoute,
    private recoService: RecommendationService,
    private notifService: NotificationService,
    private activityService: ActivityService,
    public vocalService: VocalService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.activityId = params['activityId'] || '';
      this.resetView();

      if (this.activityId) {
        this.loadActivity(this.activityId);
      } else {
        this.loadError = 'Ouvre cette page depuis une activité RH existante.';
      }
    });
  }

  resetView(): void {
    this.activity = null;
    this.prompt = '';
    this.results = [];
    this.loading = false;
    this.searched = false;
    this.confirming = false;
    this.confirmed = false;
    this.confirmMsg = '';
    this.confirmError = '';
    this.meta = null;
    this.loadError = '';
  }

  loadActivity(id: string): void {
    this.activityService.getActivityById(id).subscribe({
      next: (activity) => {
        this.activity = activity;

        const skills = (activity.requiredSkills || []).map(s => s.name).filter(Boolean).join(', ');
        this.prompt =
`Contexte activité :
Titre : ${activity.title}
Description : ${activity.description || ''}
Type : ${activity.type || ''}
Compétences requises : ${skills || 'Aucune'}
Nombre de places : ${activity.seats || 5}

Instructions RH :
Je veux les employés les plus adaptés à cette activité.`;
      },
      error: (err) => {
        this.loadError = err.error?.message || 'Impossible de charger l’activité.';
      }
    });
  }

  search(): void {
    if (!this.activityId || !this.prompt.trim()) return;

    this.loading = true;
    this.searched = false;
    this.results = [];
    this.confirmed = false;
    this.confirmMsg = '';
    this.confirmError = '';

    this.recoService.getRecommendations(this.activityId, this.prompt.trim()).subscribe({
      next: (res: any) => {
        this.results = res?.recommendations || [];
        this.meta = res?.meta || null;
        this.loading = false;
        this.searched = true;
      },
      error: (err: any) => {
        this.results = [];
        this.meta = null;
        this.loading = false;
        this.searched = true;
        this.loadError = err.error?.message || 'Erreur pendant la recommandation.';
      }
    });
  }

  getScore(r: any): number {
    const value = Number(r?.score || 0);
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }

  getValidEmployeesForConfirmation(): any[] {
    return this.results
      .map(r => ({
        csvEmployeeId: r.csvEmployeeId || null,
        employeeId: r.employeeId || null,
        userId: r.userId || null,
        email: r.email || '',
        name: r.name || 'Employé',
        score: this.getScore(r)
      }))
      .filter(emp => emp.userId || emp.email || emp.employeeId);
  }

  confirmAndNotifyAll(): void {
    if (!this.activityId || !this.results.length || this.confirming || this.confirmed) return;

    const employees = this.getValidEmployeesForConfirmation();

    if (!employees.length) {
      this.confirmError = 'Aucun employé recommandé ne peut être relié à un compte utilisateur.';
      return;
    }

    this.confirming = true;
    this.confirmMsg = '';
    this.confirmError = '';

    this.notifService.confirmRecommendations({
      activityId: this.activityId,
      prompt: this.prompt.trim(),
      employees
    }).subscribe({
      next: (res: any) => {
        this.confirming = false;
        this.confirmed = true;
        const sent = Number(res?.sent || 0);
        this.confirmMsg = `✅ Confirmation RH enregistrée. ${sent}/${employees.length} employés ont reçu une notification et un email.`;
      },
      error: (err: any) => {
        this.confirming = false;
        this.confirmError = err.error?.message || 'Erreur lors de la confirmation RH.';
      }
    });
  }
}