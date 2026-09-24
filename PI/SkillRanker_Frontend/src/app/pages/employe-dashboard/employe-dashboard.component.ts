import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface EmployeeAssignment {
  activityId: string;
  title: string;
  description: string;
  type: string;
  category: string;
  assignedAt: string;
  status: string;

  justification?: string;
  notificationRead?: boolean;
  emailSent?: boolean;
  respondedAt?: string | null;
  completedAt?: string | null;
  certificateUrl?: string | null;
  employeeResponse?: string;

  managerScore?: number | null;
  managerComment?: string;
  managerEvaluatedAt?: string | null;
  managerEvaluatedBy?: string | null;

  activity?: any;
  managerEvaluation?: any;
  evaluation?: any;
  selectedEmployee?: any;

  uiStatus?: 'NEW' | 'IN_PROGRESS' | 'CERTIFIED';
}

interface EmployeeNotification {
  id: string;
  activityId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  status: string;
  type?: string;
  isRead?: boolean;
}

@Component({
  selector: 'app-employe-dashboard',
  templateUrl: './employe-dashboard.component.html',
  styleUrls: ['./employe-dashboard.component.css']
})
export class EmployeDashboardComponent implements OnInit {
  assignments: EmployeeAssignment[] = [];
  filteredAssignments: EmployeeAssignment[] = [];
  notifications: EmployeeNotification[] = [];

  selectedTab: 'NEW' | 'IN_PROGRESS' | 'CERTIFIED' = 'NEW';

  pendingResponseCount = 0;
  acceptedCount = 0;
  certificationCount = 0;
  unreadCount = 0;

  loading = false;
  errorMessage = '';
  showNotifPanel = false;

  showReasonMap: Record<string, boolean> = {};
  refusalReason: Record<string, string> = {};
  respondingMap: Record<string, boolean> = {};
  respondMsg: Record<string, string> = {};

  private apiUrl = 'https://chowder-snooze-mutt.ngrok-free.dev/api/notifications';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken') ||
      '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private normalizeStatus(status: string | undefined | null): 'NEW' | 'IN_PROGRESS' | 'CERTIFIED' {
    const value = String(status || '').trim().toUpperCase();

    if (value === 'PENDING' || value === 'ASSIGNED') {
      return 'NEW';
    }

    if (value === 'ACCEPTED' || value === 'IN_PROGRESS' || value === 'COMPLETED') {
      return 'IN_PROGRESS';
    }

    if (value === 'CERTIFIED') {
      return 'CERTIFIED';
    }

    return 'NEW';
  }

  private normalizeNotificationsResponse(res: any): { notifications: EmployeeNotification[]; unread: number } {
    if (Array.isArray(res)) {
      const notifications = res.map((n: EmployeeNotification) => ({
        ...n,
        read: Boolean((n as any)?.read ?? (n as any)?.isRead)
      }));

      return {
        notifications,
        unread: notifications.filter((n: EmployeeNotification) => !n.read).length
      };
    }

    const notifications = Array.isArray(res?.notifications)
      ? res.notifications.map((n: EmployeeNotification) => ({
          ...n,
          read: Boolean((n as any)?.read ?? (n as any)?.isRead)
        }))
      : [];

    const unread =
      typeof res?.unread === 'number'
        ? res.unread
        : notifications.filter((n: EmployeeNotification) => !n.read).length;

    return { notifications, unread };
  }

  loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.loadAssignments();
    this.loadNotifications();
  }

  loadAssignments(): void {
    this.http.get<EmployeeAssignment[]>(`${this.apiUrl}/my-activities`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (data: EmployeeAssignment[]): void => {
        console.log('MY ACTIVITIES RESPONSE = ', data);

        this.assignments = (data || []).map((item: any) => {
          const managerScore =
            item.managerScore ??
            item.managerEvaluation?.score ??
            item.managerEvaluation?.managerScore ??
            item.evaluation?.score ??
            item.evaluation?.managerScore ??
            item.selectedEmployee?.managerScore ??
            item.selectedEmployee?.score ??
            item.activity?.managerScore ??
            item.activity?.managerEvaluation?.score ??
            item.activity?.evaluation?.score ??
            null;

          const managerComment =
            item.managerComment ||
            item.managerEvaluation?.comment ||
            item.managerEvaluation?.managerComment ||
            item.evaluation?.comment ||
            item.evaluation?.managerComment ||
            item.selectedEmployee?.managerComment ||
            item.selectedEmployee?.comment ||
            item.activity?.managerComment ||
            item.activity?.managerEvaluation?.comment ||
            item.activity?.evaluation?.comment ||
            '';

          const managerEvaluatedAt =
            item.managerEvaluatedAt ||
            item.managerEvaluation?.evaluatedAt ||
            item.managerEvaluation?.managerEvaluatedAt ||
            item.evaluation?.evaluatedAt ||
            item.evaluation?.managerEvaluatedAt ||
            item.selectedEmployee?.managerEvaluatedAt ||
            item.selectedEmployee?.evaluatedAt ||
            item.activity?.managerEvaluatedAt ||
            item.activity?.managerEvaluation?.evaluatedAt ||
            item.activity?.evaluation?.evaluatedAt ||
            null;

          const managerEvaluatedBy =
            item.managerEvaluatedBy ||
            item.managerEvaluation?.managerId ||
            item.managerEvaluation?.evaluatedBy ||
            item.evaluation?.managerId ||
            item.evaluation?.evaluatedBy ||
            item.selectedEmployee?.managerEvaluatedBy ||
            item.selectedEmployee?.managerId ||
            item.activity?.managerEvaluatedBy ||
            null;

          return {
            ...item,

            title: item.title || item.activity?.title || '',
            description: item.description || item.activity?.description || '',
            type: item.type || item.activity?.type || '',
            category: item.category || item.activity?.category || '',

            assignedAt:
              item.assignedAt ||
              item.selectedAt ||
              item.activity?.createdAt ||
              '',

            certificateUrl:
              item.certificateUrl ||
              item.activity?.certificateUrl ||
              null,

            managerScore,
            managerComment,
            managerEvaluatedAt,
            managerEvaluatedBy,

            uiStatus: this.normalizeStatus(item.status)
          };
        });

        console.log('MAPPED ASSIGNMENTS = ', this.assignments);

        this.refreshCounters();
        this.applyTabFilter();
        this.loading = false;
      },
      error: (err: unknown): void => {
        console.error('Erreur chargement activités employé:', err);
        this.errorMessage = 'Impossible de charger les activités.';
        this.loading = false;
      }
    });
  }

  loadNotifications(): void {
    this.http.get<any>(`${this.apiUrl}/my-notifications`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (res: any): void => {
        const normalized = this.normalizeNotificationsResponse(res);

        this.notifications = normalized.notifications;
        this.unreadCount = normalized.unread;
      },
      error: (err: unknown): void => {
        console.error('Erreur chargement notifications:', err);
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  refreshCounters(): void {
    this.pendingResponseCount = this.assignments.filter(
      (a: EmployeeAssignment) => a.uiStatus === 'NEW'
    ).length;

    this.acceptedCount = this.assignments.filter((a: EmployeeAssignment) => {
      const status = String(a.status || '').toUpperCase();
      return status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED';
    }).length;

    this.certificationCount = this.assignments.filter((a: EmployeeAssignment) => {
      const status = String(a.status || '').toUpperCase();
      return status === 'CERTIFIED';
    }).length;
  }

  selectTab(tab: 'NEW' | 'IN_PROGRESS' | 'CERTIFIED'): void {
    this.selectedTab = tab;
    this.applyTabFilter();
  }

  applyTabFilter(): void {
    this.filteredAssignments = this.assignments.filter(
      (a: EmployeeAssignment) => a.uiStatus === this.selectedTab
    );
  }

  toggleNotifPanel(): void {
    this.showNotifPanel = !this.showNotifPanel;
  }

  onNotificationClick(n: EmployeeNotification): void {
    if (!n.read) {
      this.http.put(`${this.apiUrl}/read/${n.activityId}`, {}, {
        headers: this.getAuthHeaders()
      }).subscribe({
        next: (): void => {
          n.read = true;
          n.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);

          const found = this.assignments.find(
            (a: EmployeeAssignment) => a.activityId === n.activityId
          );

          if (found) {
            found.notificationRead = true;
          }
        },
        error: (err: unknown): void => {
          console.error('Erreur mark-read:', err);
        }
      });
    }

    this.showNotifPanel = false;
    this.selectedTab = 'NEW';
    this.applyTabFilter();

    setTimeout(() => {
      const el = document.getElementById(`activity-${n.activityId}`);

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  toggleRefusalReason(activityId: string): void {
    this.showReasonMap[activityId] = !this.showReasonMap[activityId];

    if (!this.showReasonMap[activityId]) {
      this.refusalReason[activityId] = '';
    }
  }

  acceptActivity(activityId: string): void {
    this.respondingMap[activityId] = true;
    this.respondMsg[activityId] = '';

    this.http.post(
      `${this.apiUrl}/respond`,
      {
        activityId,
        status: 'ACCEPTED'
      },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (): void => {
        const item = this.assignments.find(
          (a: EmployeeAssignment) => a.activityId === activityId
        );

        if (item) {
          item.status = 'ACCEPTED';
          item.uiStatus = 'IN_PROGRESS';
          item.respondedAt = new Date().toISOString();
          item.notificationRead = true;
        }

        const notif = this.notifications.find(
          (n: EmployeeNotification) => n.activityId === activityId
        );

        if (notif && !notif.read) {
          notif.read = true;
          notif.isRead = true;
        }

        this.unreadCount = this.notifications.filter(
          (n: EmployeeNotification) => !n.read
        ).length;

        this.respondMsg[activityId] = '✅ Activité acceptée avec succès.';
        this.refreshCounters();
        this.applyTabFilter();
        this.respondingMap[activityId] = false;
      },
      error: (err: unknown): void => {
        console.error('Erreur acceptation activité:', err);
        this.respondMsg[activityId] = '❌ Erreur lors de l’acceptation.';
        this.respondingMap[activityId] = false;
      }
    });
  }

  refuseActivity(activityId: string): void {
    this.respondingMap[activityId] = true;
    this.respondMsg[activityId] = '';

    this.http.post(
      `${this.apiUrl}/respond`,
      {
        activityId,
        status: 'DECLINED',
        justification: this.refusalReason[activityId] || ''
      },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (): void => {
        this.assignments = this.assignments.filter(
          (a: EmployeeAssignment) => a.activityId !== activityId
        );

        this.notifications = Array.isArray(this.notifications)
          ? this.notifications.map((n: EmployeeNotification) =>
              n.activityId === activityId
                ? { ...n, read: true, isRead: true }
                : n
            )
          : [];

        this.unreadCount = this.notifications.filter(
          (n: EmployeeNotification) => !n.read
        ).length;

        this.respondMsg[activityId] = '✅ Activité refusée avec succès.';
        this.showReasonMap[activityId] = false;
        this.refusalReason[activityId] = '';

        this.refreshCounters();
        this.applyTabFilter();
        this.respondingMap[activityId] = false;
      },
      error: (err: unknown): void => {
        console.error('Erreur refus activité:', err);
        this.respondMsg[activityId] = '❌ Erreur lors du refus.';
        this.respondingMap[activityId] = false;
      }
    });
  }

  canCompleteTraining(item: EmployeeAssignment): boolean {
    if (String(item.type || '').toUpperCase() !== 'TRAINING') {
      return false;
    }

    if (item.uiStatus !== 'IN_PROGRESS') {
      return false;
    }

    const status = String(item.status || '').toUpperCase();

    if (status === 'COMPLETED' || status === 'CERTIFIED') {
      return false;
    }

    const endDate = item.activity?.endDate;

    if (!endDate) {
      return false;
    }

    return new Date() >= new Date(endDate);
  }

  isWaitingRhValidation(item: EmployeeAssignment): boolean {
    return String(item.status || '').toUpperCase() === 'COMPLETED';
  }

  hasManagerEvaluation(item: EmployeeAssignment): boolean {
    return (
      item.managerScore !== undefined &&
      item.managerScore !== null &&
      Number(item.managerScore) > 0
    ) || !!(item.managerComment && item.managerComment.trim());
  }

  getManagerScoreStars(score?: number | null): string {
    const s = Math.max(0, Math.min(5, Number(score || 0)));

    if (!s) {
      return '';
    }

    return '★'.repeat(s) + '☆'.repeat(5 - s);
  }

  completeTraining(activityId: string): void {
    this.respondingMap[activityId] = true;
    this.respondMsg[activityId] = '';

    this.http.post(
      `${this.apiUrl}/complete`,
      { activityId },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (): void => {
        const item = this.assignments.find(
          (a: EmployeeAssignment) => a.activityId === activityId
        );

        if (item) {
          item.status = 'COMPLETED';
          item.uiStatus = 'IN_PROGRESS';
          item.completedAt = new Date().toISOString();
        }

        this.respondMsg[activityId] = '✅ Formation terminée. En attente de validation RH.';
        this.refreshCounters();
        this.applyTabFilter();
        this.respondingMap[activityId] = false;
      },
      error: (err: any): void => {
        console.error('Erreur fin formation:', err);
        this.respondMsg[activityId] =
          err?.error?.message || '❌ Erreur lors de la finalisation.';
        this.respondingMap[activityId] = false;
      }
    });
  }

  openCertificate(certificateUrl?: string | null): void {
    if (!certificateUrl) {
      alert('Certificat non disponible.');
      return;
    }

    window.open(certificateUrl, '_blank');
  }

  openActivity(item: EmployeeAssignment): void {
    this.router.navigate(['/activitiesEmpl'], {
      queryParams: { activityId: item.activityId }
    });
  }
}