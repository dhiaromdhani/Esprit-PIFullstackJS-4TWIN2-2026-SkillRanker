import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../service/user.service';
import { AuthService } from '../service/auth.service';
import { User } from '../model/user.model';
import { DashboardService } from '../service/dashboard.service';
import { ActivityService } from '../service/activity.service';

export interface ProfileStat {
  label: string;
  value: number;
}

@Component({
  selector: 'app-profilemploye',
  templateUrl: './profilemploye.component.html',
  styleUrl: './profilemploye.component.css'
})
export class ProfilemployeComponent implements OnInit {
    user!: User;
    profileForm!: FormGroup;
  
    stats: ProfileStat[] = [];
    recentActivities: any[] = [];
    saving = false;
    saveError: string | null = null;
  
    /** Manager, HR, and Administrator may change their own personnel fields. */
    get canEditPersonnelProfile(): boolean {
      const r = this.normalizeRole(this.user?.role);
      return r === 'ADMINISTRATOR' || r === 'HR_MANAGER' || r === 'MANAGER';
    }
  
    private normalizeRole(role: string | undefined): string {
      let r = String(role == null ? '' : role)
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_');
      if (r === 'HR_MANAGER' || r === 'HRMANAGER') {
        return 'HR_MANAGER';
      }
      if (r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'SUPERADMIN') {
        return 'ADMINISTRATOR';
      }
      if (r === 'MGR' || r === 'MANAGERS') {
        return 'MANAGER';
      }
      return r;
    }
  
    /** Id Mongo pour les appels API (getMe peut exposer `_id` ou `id`). */
    private currentUserRecordId(): string | null {
      if (!this.user) return null;
      const u = this.user as User & { id?: string };
      const fromMe = u._id ?? u.id;
      const fromSession = this.auth.getUserId();
      const raw =
        fromMe != null && String(fromMe).trim() !== ''
          ? String(fromMe).trim()
          : fromSession != null && String(fromSession).trim() !== ''
            ? String(fromSession).trim()
            : null;
      return raw;
    }
  
    constructor(
      private userService: UserService,
      private auth: AuthService,
      private dashboardService: DashboardService,
      private activityService: ActivityService,
      private fb: FormBuilder
    ) {}
  
    ngOnInit(): void {
      this.userService.getMe().subscribe({
        next: (res) => {
          const u = res as User & { id?: string };
          this.user = { ...u, _id: u._id ?? u.id };
          this.initForm();
          this.loadRoleData();
        },
        error: () => {
          this.saveError = 'Impossible de charger le profil. Vérifiez que vous êtes connecté.';
        }
      });
    }
  
    loadRoleData(): void {
      const role = this.normalizeRole(this.user.role);
      if (role === 'ADMINISTRATOR' || role === 'HR_MANAGER' || role === 'MANAGER') {
        this.dashboardService.getStats().subscribe({
          next: (dashboard) => {
            if (role === 'ADMINISTRATOR') {
              this.stats = [
                { label: 'Users', value: dashboard.users?.total || 0 },
                { label: 'Employees', value: dashboard.users?.byRole?.employees || 0 },
                { label: 'Activities', value: dashboard.activities?.total || 0 }
              ];
            } else if (role === 'HR_MANAGER') {
              this.stats = [
                { label: 'Employees', value: dashboard.users?.byRole?.employees || 0 },
                { label: 'Managers', value: dashboard.users?.byRole?.managers || 0 },
                { label: 'Activities', value: dashboard.activities?.total || 0 }
              ];
            } else {
              this.stats = [
                { label: 'Activities', value: dashboard.activities?.total || 0 },
                { label: 'Open', value: dashboard.activities?.byStatus?.open || 0 },
                { label: 'Completed', value: dashboard.activities?.byStatus?.completed || 0 }
              ];
            }
            this.recentActivities = dashboard.activities?.recent?.slice(0, 3) || [];
          },
          error: () => this.fallbackStats()
        });
      } else if (role === 'EMPLOYEE') {
        this.activityService.getMyActivities().subscribe({
          next: (activities) => {
            const totalActivities = activities.length;
            const completed = activities.filter(a => ['COMPLETED', 'TERMINE', 'APPROVED'].includes(a.status?.toUpperCase() || '')).length;
            const inProgress = activities.filter(a => ['IN_PROGRESS', 'EN_COURS', 'OPEN'].includes(a.status?.toUpperCase() || '')).length;
            this.stats = [
              { label: 'Items', value: totalActivities },
              { label: 'In progress', value: inProgress },
              { label: 'Done', value: completed }
            ];
            this.recentActivities = activities.sort((a, b) => {
              const dateA = a.updatedAt || a.createdAt || a.date || '';
              const dateB = b.updatedAt || b.createdAt || b.date || '';
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            }).slice(0, 3);
          },
          error: () => this.fallbackStats()
        });
      } else {
        this.fallbackStats();
      }
    }
  
    fallbackStats(): void {
      this.stats = [
        { label: 'Team', value: 0 },
        { label: 'Projects', value: 0 },
        { label: 'Tasks', value: 0 },
      ];
      this.recentActivities = [];
    }
  
    initForm(): void {
      this.profileForm = this.fb.group({
        name:      [this.user.name,      Validators.required],
        email:     [this.user.email,     [Validators.required, Validators.email]],
        telephone: [this.user.telephone],
        matricule: [this.user.matricule],
      });
      this.applyProfileFormEditability();
    }
  
    private applyProfileFormEditability(): void {
      if (!this.profileForm) return;
      if (this.canEditPersonnelProfile) {
        this.profileForm.enable();
      } else {
        this.profileForm.disable();
      }
    }
  
    onSubmit(): void {
      if (!this.canEditPersonnelProfile) {
        return;
      }
      if (this.saving || !this.profileForm.valid) {
        return;
      }
      const id = this.currentUserRecordId();
      if (!id) {
        this.saveError = 'Identifiant utilisateur manquant : impossible d’enregistrer.';
        return;
      }
      this.saveError = null;
      this.saving = true;
      this.userService.updateUser(id, this.profileForm.getRawValue()).subscribe({
        next: () => {
          this.userService.getMe().subscribe({
            next: (res) => {
              const u = res as User & { id?: string };
              this.user = { ...u, _id: u._id ?? u.id };
              this.initForm();
              this.saving = false;
              this.loadRoleData();
            },
            error: () => {
              this.saving = false;
              this.saveError = 'Enregistré, mais impossible de recharger le profil.';
            },
          });
        },
        error: (err: { error?: { message?: string }; message?: string; status?: number }) => {
          this.saving = false;
          const msg =
            err?.error?.message ||
            (err?.status === 403
              ? 'Accès refusé : vérifiez que vous modifiez bien votre propre compte.'
              : null) ||
            err?.message ||
            'Erreur lors de l’enregistrement.';
          this.saveError = msg;
        },
      });
    }
  
    onEdit(): void {
      document.querySelector('.pf-card--form')?.scrollIntoView({ behavior: 'smooth' });
    }
  
    onCancel(): void {
      this.saveError = null;
      this.profileForm.reset({
        name:      this.user.name,
        email:     this.user.email,
        telephone: this.user.telephone,
        matricule: this.user.matricule,
      });
    }
  
    actStatusUpper(act: { status?: string }): string {
      return (act?.status || '').toUpperCase();
    }
  
    isActDone(act: { status?: string }): boolean {
      return ['COMPLETED', 'TERMINE', 'APPROVED'].includes(this.actStatusUpper(act));
    }
  
    isActInProgress(act: { status?: string }): boolean {
      return ['IN_PROGRESS', 'EN_COURS', 'OPEN'].includes(this.actStatusUpper(act));
    }

}
