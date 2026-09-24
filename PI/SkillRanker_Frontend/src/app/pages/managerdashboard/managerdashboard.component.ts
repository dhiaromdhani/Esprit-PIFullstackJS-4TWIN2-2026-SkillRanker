import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../../service/employee.service';
import { Employee } from '../../model/employee.model';
import {
  DashboardService,
  DashboardStats,
  EmployeeResponseRow,
  ManagerEvaluationRow
} from '../../service/dashboard.service';
import { Router } from '@angular/router';
import { VocalService } from '../../service/vocal.service';

@Component({
  selector: 'app-managerdashboard',
  templateUrl: './managerdashboard.component.html',
  styleUrls: ['./managerdashboard.component.css']
})
export class MANAGERDashboardComponent implements OnInit {
  employees: Employee[] = [];
  employeeForm!: FormGroup;

  showModal = false;
  editMode = false;
  selectedId: string | null = null;

  loading = false;
  error: string | null = null;

  employeeResponses: EmployeeResponseRow[] = [];
  responsesLoading = false;
  responsesError: string | null = null;

  evaluationTargets: ManagerEvaluationRow[] = [];
  evaluationsLoading = false;
  evaluationsError: string | null = null;

  selectedEvaluation: ManagerEvaluationRow | null = null;
  evaluationScore = 5;
  evaluationComment = '';
  showEvaluationModal = false;
  evaluationSaving = false;

  stats: DashboardStats = {
    users: {
      total: 0,
      byRole: {
        employees: 0,
        managers: 0,
        hrManagers: 0,
        admins: 0
      }
    },
    activities: {
      total: 0,
      byStatus: {
        draft: 0,
        open: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
      },
      byType: {
        training: 0,
        certification: 0,
        project: 0,
        mission: 0,
        audit: 0
      },
      byCategory: {
        technical: 0,
        management: 0,
        transversal: 0
      },
      totalSeats: 0,
      recent: [],
      monthly: []
    }
  };

  searchFilters: {
    name?: string;
    department?: string;
    jobTitle?: string;
    email?: string;
  } = {};

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private router: Router,
    public vocalService: VocalService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
    this.loadStats();
    this.loadEmployeeResponses();
    this.loadEvaluationTargets();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: ['', Validators.required],
      department: ['', Validators.required],
      skills: [[]]
    });
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data: DashboardStats): void => {
        this.stats = data;
      },
      error: (err: unknown): void => {
        console.error('Dashboard manager stats error:', err);
      }
    });
  }

  loadEmployeeResponses(): void {
    this.responsesLoading = true;
    this.responsesError = null;

    this.dashboardService.getEmployeeResponses().subscribe({
      next: (rows: EmployeeResponseRow[]): void => {
        this.employeeResponses = Array.isArray(rows) ? rows : [];
        this.responsesLoading = false;
      },
      error: (err: unknown): void => {
        console.error('Manager responses error:', err);
        this.responsesError = 'Erreur lors du chargement des réponses employés.';
        this.responsesLoading = false;
      }
    });
  }

  loadEvaluationTargets(): void {
    this.evaluationsLoading = true;
    this.evaluationsError = null;

    this.dashboardService.getManagerEvaluationTargets().subscribe({
      next: (rows: ManagerEvaluationRow[]): void => {
        this.evaluationTargets = Array.isArray(rows) ? rows : [];
        this.evaluationsLoading = false;
      },
      error: (err: unknown): void => {
        console.error('Manager evaluation targets error:', err);
        this.evaluationsError = 'Erreur lors du chargement des évaluations.';
        this.evaluationsLoading = false;
      }
    });
  }

  openEvaluationModal(row: ManagerEvaluationRow): void {
    this.selectedEvaluation = row;
    this.evaluationScore = row.managerScore ?? 5;
    this.evaluationComment = row.managerComment || '';
    this.showEvaluationModal = true;
  }

  closeEvaluationModal(): void {
    if (this.evaluationSaving) return;

    this.showEvaluationModal = false;
    this.selectedEvaluation = null;
    this.evaluationScore = 5;
    this.evaluationComment = '';
  }

  submitEvaluation(): void {
    if (!this.selectedEvaluation || this.evaluationSaving) {
      return;
    }

    if (this.evaluationScore < 1 || this.evaluationScore > 5) {
      alert('La note doit être entre 1 et 5.');
      return;
    }

    this.evaluationSaving = true;

    const payload = {
      activityId: this.selectedEvaluation.activityId,
      employeeId: this.selectedEvaluation.employeeId || null,
      userId: this.selectedEvaluation.userId || null,
      employeeEmail: this.selectedEvaluation.employeeEmail || null,
      score: Number(this.evaluationScore),
      comment: this.evaluationComment || ''
    };

    console.log('EVALUATION PAYLOAD = ', payload);

    this.dashboardService.evaluateEmployee(payload).subscribe({
      next: (): void => {
        this.evaluationSaving = false;

        if (this.selectedEvaluation) {
          this.selectedEvaluation.managerScore = Number(this.evaluationScore);
          this.selectedEvaluation.managerComment = this.evaluationComment || '';
          this.selectedEvaluation.managerEvaluatedAt = new Date().toISOString();
        }

        this.closeEvaluationModal();
        this.loadEvaluationTargets();

        alert('Évaluation enregistrée avec succès.');
      },
      error: (err: any): void => {
        this.evaluationSaving = false;
        console.error('Erreur évaluation:', err);
        alert(err?.error?.message || 'Erreur lors de l’enregistrement de l’évaluation.');
      }
    });
  }

  loadEmployees(): void {
    this.loading = true;
    this.error = null;

    this.employeeService.getEmployees(this.searchFilters).subscribe({
      next: (res: Employee[]): void => {
        this.employees = res;
        this.loading = false;
      },
      error: (err: any): void => {
        this.error = 'Erreur lors du chargement des employés: ' + (err?.message || 'Erreur inconnue');
        this.loading = false;
        console.error('Error loading employees:', err);
      }
    });
  }

  applyFilters(): void {
    this.loadEmployees();
  }

  openModal(): void {
    this.editMode = false;
    this.selectedId = null;
    this.employeeForm.reset();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.employeeForm.reset();
    this.editMode = false;
    this.selectedId = null;
  }

  closeOnBackdrop(): void {
    this.closeModal();
  }

  submitEmployee(): void {
    if (this.employeeForm.invalid) return;

    const formValue: any = { ...this.employeeForm.value };

    if (typeof formValue.skills === 'string') {
      formValue.skills = formValue.skills
        .split(',')
        .map((skill: string) => ({
          name: skill.trim(),
          level: 1
        }));
    }

    if (this.editMode && this.selectedId) {
      this.loading = true;

      this.employeeService.updateEmployee(this.selectedId, formValue).subscribe({
        next: (): void => {
          this.loadEmployees();
          this.closeModal();
          this.loading = false;
        },
        error: (err: any): void => {
          this.error = 'Erreur lors de la mise à jour: ' + (err?.message || 'Erreur inconnue');
          this.loading = false;
          console.error('Error updating employee:', err);
        }
      });
    } else {
      this.loading = true;

      this.employeeService.createEmployee(formValue).subscribe({
        next: (res: Employee): void => {
          this.employees = [...this.employees, res];
          this.closeModal();
          this.loading = false;
        },
        error: (err: any): void => {
          this.error = 'Erreur lors de la création: ' + (err?.message || 'Erreur inconnue');
          this.loading = false;
          console.error('Error creating employee:', err);
        }
      });
    }
  }

  editEmployee(emp: Employee): void {
    this.editMode = true;
    this.selectedId = emp._id ?? null;

    const skillsString = emp.skills
      ? emp.skills.map((skill: any) => skill.name).join(', ')
      : '';

    this.employeeForm.patchValue({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle,
      department: emp.department,
      skills: skillsString
    });

    this.showModal = true;
  }

  deleteEmployee(id?: string): void {
    if (!id) return;

    this.loading = true;

    this.employeeService.deleteEmployee(id).subscribe({
      next: (): void => {
        this.employees = this.employees.filter((e: Employee) => e._id !== id);
        this.loading = false;
      },
      error: (err: any): void => {
        this.error = 'Erreur lors de la suppression: ' + (err?.message || 'Erreur inconnue');
        this.loading = false;
        console.error('Error deleting employee:', err);
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getTypePercent(count: number): number {
    const total = this.stats?.activities?.total || 1;
    return Math.round((count / total) * 100);
  }

  getStatusPercent(count: number): number {
    const total = this.stats?.activities?.total || 1;
    return Math.round((count / total) * 100);
  }

  getTypeLabel(t: string): string {
    const map: Record<string, string> = {
      training: 'Formation',
      certification: 'Certification',
      project: 'Projet',
      mission: 'Mission',
      audit: 'Audit',
      TRAINING: 'Formation',
      CERTIFICATION: 'Certification',
      PROJECT: 'Projet',
      MISSION: 'Mission',
      AUDIT: 'Audit'
    };

    return map[t] || t;
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = {
      draft: 'Brouillon',
      open: 'Ouverte',
      inProgress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
      DRAFT: 'Brouillon',
      OPEN: 'Ouverte',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée'
    };

    return map[s] || s;
  }

  getStatusColor(s: string): string {
    const map: Record<string, string> = {
      draft: 'secondary',
      open: 'primary',
      inProgress: 'warning',
      completed: 'success',
      cancelled: 'danger',
      DRAFT: 'secondary',
      OPEN: 'primary',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'danger'
    };

    return map[s] || 'secondary';
  }

  getResponseLabel(status: string): string {
    const s = String(status || '').toUpperCase();

    const map: Record<string, string> = {
      ACCEPTED: 'Acceptée',
      DECLINED: 'Refusée',
      REFUSED: 'Refusée',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée',
      CERTIFIED: 'Certifiée'
    };

    return map[s] || s;
  }

  getResponseBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();

    if (s === 'ACCEPTED' || s === 'COMPLETED' || s === 'CERTIFIED') {
      return 'bg-success';
    }

    if (s === 'DECLINED' || s === 'REFUSED') {
      return 'bg-danger';
    }

    if (s === 'IN_PROGRESS') {
      return 'bg-warning text-dark';
    }

    return 'bg-secondary';
  }

  getEvaluationStatusLabel(status: string): string {
    const s = String(status || '').toUpperCase();

    if (s === 'COMPLETED') return 'Terminée';
    if (s === 'CERTIFIED') return 'Certifiée';

    return s;
  }

  getEvaluationScoreLabel(score?: number | null): string {
    if (!score) return 'Non évalué';
    return `${score}/5`;
  }
}