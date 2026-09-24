import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../service/notification.service';

@Component({
  selector: 'app-activte-emloyee',
  templateUrl: './activte-emloyee.component.html',
  styleUrl: './activte-emloyee.component.css'
})
export class ActivteEmloyeeComponent implements OnInit {
  myActivities: any = {
    assigned: [],
    accepted: [],
    refused: [],
    completed: [],
    certified: []
  };

  loading = true;
  focusActivityId = '';

  respondingMap: Record<string, boolean> = {};
  flashMap: Record<string, string> = {};
  refusalReason: Record<string, string> = {};
  showReasonMap: Record<string, boolean> = {};

  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.focusActivityId = params['activityId'] || '';
      this.loadMyActivities();
    });
  }

  loadMyActivities(): void {
    this.loading = true;
    this.notificationService.getMyActivities().subscribe({
      next: (data: any) => {
        this.myActivities = data || {
          assigned: [],
          accepted: [],
          refused: [],
          completed: [],
          certified: []
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getActivityId(item: any): string {
    return item?.activity?._id || item?.activityId || '';
  }

  getActivityTitle(item: any): string {
    return item?.activity?.title || 'Activité';
  }

  getActivityDescription(item: any): string {
    return item?.activity?.description || '';
  }

  getActivityType(item: any): string {
    return item?.activity?.type || '';
  }

  getActivityLocation(item: any): string {
    return item?.activity?.location || '';
  }

isFocused(item: any): boolean {
  return !!this.focusActivityId && this.getActivityId(item) === this.focusActivityId;
}

  toggleRefusalReason(activityId: string): void {
    this.showReasonMap[activityId] = !this.showReasonMap[activityId];
  }

  acceptActivity(activityId: string): void {
    if (!activityId) return;

    this.respondingMap[activityId] = true;
    this.flashMap[activityId] = '';

    this.notificationService.respondToActivity(activityId, true).subscribe({
      next: () => {
        this.respondingMap[activityId] = false;
        this.flashMap[activityId] = '✅ Activité acceptée.';
        this.loadMyActivities();
      },
      error: (err: any) => {
        this.respondingMap[activityId] = false;
        this.flashMap[activityId] = err.error?.message || 'Erreur lors de l’acceptation.';
      }
    });
  }

  refuseActivity(activityId: string): void {
    if (!activityId) return;

    const reason = String(this.refusalReason[activityId] || '').trim();
    if (!reason) {
      this.flashMap[activityId] = 'La justification est obligatoire pour refuser.';
      return;
    }

    this.respondingMap[activityId] = true;
    this.flashMap[activityId] = '';

    this.notificationService.respondToActivity(activityId, false, reason).subscribe({
      next: () => {
        this.respondingMap[activityId] = false;
        this.flashMap[activityId] = '✅ Refus envoyé au RH et au manager.';
        this.showReasonMap[activityId] = false;
        this.loadMyActivities();
      },
      error: (err: any) => {
        this.respondingMap[activityId] = false;
        this.flashMap[activityId] = err.error?.message || 'Erreur lors du refus.';
      }
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      TRAINING: 'Formation',
      CERTIFICATION: 'Certification',
      PROJECT: 'Projet',
      MISSION: 'Mission',
      AUDIT: 'Audit'
    };
    return labels[type] || type || 'Activité';
  }
}