import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../service/user.service';
import { User } from '../model/user.model';
import { DashboardService } from '../service/dashboard.service';
import { ActivityService } from '../service/activity.service';

export interface ProfileStat {
  label: string;
  value: number;
}

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css'
})
export class ProfilComponent implements OnInit {

  user!: User;
  profileForm!: FormGroup;

  stats: ProfileStat[] = [];
  recentActivities: any[] = [];

  constructor(
    private userService: UserService,
    private dashboardService: DashboardService,
    private activityService: ActivityService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.userService.getMe().subscribe(res => {
      this.user = res;
      this.initForm();
      this.loadRoleData();
    });
  }

  loadRoleData(): void {
    if (this.user.role === 'ADMINISTRATOR' || this.user.role === 'HR_MANAGER') {
      this.dashboardService.getStats().subscribe({
        next: (dashboard) => {
          if (this.user.role === 'ADMINISTRATOR') {
            this.stats = [
              { label: 'Utilisateurs', value: dashboard.users?.total || 0 },
              { label: 'Employés', value: dashboard.users?.byRole?.employees || 0 },
              { label: 'Activités', value: dashboard.activities?.total || 0 }
            ];
          } else { // HR_MANAGER
            this.stats = [
              { label: 'Employés', value: dashboard.users?.byRole?.employees || 0 },
              { label: 'Managers', value: dashboard.users?.byRole?.managers || 0 },
              { label: 'Participations', value: dashboard.activities?.totalSeats || 0 }
            ];
          }
          this.recentActivities = dashboard.activities?.recent?.slice(0, 3) || [];
        },
        error: () => this.fallbackStats()
      });
    } else if (this.user.role === 'MANAGER' || this.user.role === 'EMPLOYEE') {
      this.activityService.getMyActivities().subscribe({
        next: (activities) => {
          const totalActivities = activities.length;
          const completed = activities.filter(a => ['COMPLETED', 'TERMINE', 'APPROVED'].includes(a.status?.toUpperCase() || '')).length;
          const inProgress = activities.filter(a => ['IN_PROGRESS', 'EN_COURS', 'OPEN'].includes(a.status?.toUpperCase() || '')).length;
          
          if (this.user.role === 'MANAGER') {
            this.stats = [
              { label: 'Mes Projets', value: totalActivities },
              { label: 'En cours', value: inProgress },
              { label: 'Terminés', value: completed }
            ];
          } else { // EMPLOYEE
            this.stats = [
              { label: 'Participations', value: totalActivities },
              { label: 'Missions', value: inProgress },
              { label: 'Validation', value: completed }
            ];
          }
          
          // Fallback tri temporel sur createdAt
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
      { label: 'Équipe', value: 0 },
      { label: 'Projets', value: 0 },
      { label: 'Tâches', value: 0 },
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
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.userService.updateUser(this.user._id!, this.profileForm.value).subscribe(() => {
        this.userService.getMe().subscribe(res => {
           this.user = res;
           this.loadRoleData();
        });
      });
    }
  }

  onEdit(): void {
    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  onCancel(): void {
    this.profileForm.reset({
      name:      this.user.name,
      email:     this.user.email,
      telephone: this.user.telephone,
      matricule: this.user.matricule,
    });
  }
}