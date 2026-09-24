/*import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../service/employee.service';
import { Employee } from '../model/employee.model';
import { DashboardService, DashboardStats } from '../service/dashboard.service';
import { Router } from '@angular/router';
import { VocalService } from '../service/vocal.service';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../service/theme.service';

@Component({
  selector: 'app-hr-dashboard',
  templateUrl: './hr-dashboard.component.html',
  styleUrl: './hr-dashboard.component.css'
})
export class HrDashboardComponent implements OnInit {

  employees: Employee[] = [];
  employeeForm!: FormGroup;
  showModal = false;
  editMode = false;
  selectedId: string | null = null;
  loading = false;
  error: string | null = null;
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
 // loading = true;

 isDarkMode = false;

  constructor(
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private router: Router,
    public vocalService: VocalService,
    private translate: TranslateService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.initForm();
     this.initTheme();
    this.loadEmployees();
     this.dashboardService.getStats().subscribe({
      next: (data: DashboardStats) => { this.stats = data; this.loading = false; },
      error: (err: any) => { console.error('Dashboard HR error:', err); this.loading = false; }
    });
  }

  initTheme() {
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
    this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
  }
 toggleTheme() {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
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

  searchFilters: any = {};

  loadEmployees(): void {
    this.loading = true;
    this.error = null;
    this.employeeService.getEmployees(this.searchFilters).subscribe({
      next: (res) => {
        this.employees = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des employés: ' + err.message;
        this.loading = false;
        console.error('Error loading employees:', err);
      }
    });
  }

  applyFilters(): void {
    this.loadEmployees();
  }

  // Modal
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

  // Submit
  submitEmployee(): void {
    if (this.employeeForm.invalid) return;

    const formValue = this.employeeForm.value;

    // Convert skills from comma-separated string to array of objects
    if (typeof formValue.skills === 'string') {
      formValue.skills = formValue.skills.split(',').map((skill: string) => ({
        name: skill.trim(),
        level: 1 // Default level
      }));
    }

    if (this.editMode && this.selectedId) {
      this.loading = true;
      this.employeeService.updateEmployee(this.selectedId, formValue).subscribe({
        next: () => {
          this.loadEmployees();
          this.closeModal();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors de la mise à jour: ' + err.message;
          this.loading = false;
          console.error('Error updating employee:', err);
        }
      });
    } else {
      this.loading = true;
      this.employeeService.createEmployee(formValue).subscribe({
        next: (res) => {
          this.employees = [...this.employees, res];
          this.closeModal();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors de la création: ' + err.message;
          this.loading = false;
          console.error('Error creating employee:', err);
        }
      });
    }
  }

  // Edit
  editEmployee(emp: Employee): void {
    this.editMode = true;
    this.selectedId = emp._id ?? null;

    // Convert skills array to comma-separated string for form input
    const skillsString = emp.skills ? emp.skills.map(skill => skill.name).join(', ') : '';

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

  // Delete
  deleteEmployee(id?: string): void {
    if (!id) return;
    this.loading = true;
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e._id !== id);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors de la suppression: ' + err.message;
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
    const m: Record<string, string> = {
      training: 'Formation', certification: 'Certification', project: 'Projet',
      mission: 'Mission', audit: 'Audit',
      TRAINING: 'Formation', CERTIFICATION: 'Certification', PROJECT: 'Projet',
      MISSION: 'Mission', AUDIT: 'Audit'
    };
    return m[t] || t;
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = {
      draft: 'Brouillon', open: 'Ouverte', inProgress: 'En cours', completed: 'Terminée', cancelled: 'Annulée',
      DRAFT: 'Brouillon', OPEN: 'Ouverte', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée'
    };
    return m[s] || s;
  }

  getStatusColor(s: string): string {
    const m: Record<string, string> = {
      draft: 'secondary', open: 'primary', inProgress: 'warning', completed: 'success', cancelled: 'danger',
      DRAFT: 'secondary', OPEN: 'primary', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'danger'
    };
    return m[s] || 'secondary';
  }

  speakText(text: string, lang: string = 'fr-FR'): void {
    if (!text) return;
    this.vocalService.speak(text, lang);
  }
}*/
// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-hr-dashboard',
//   templateUrl: './hr-dashboard.component.html',
//   styleUrls: ['./hr-dashboard.component.css']
// })
// export class HrDashboardComponent {
//   isDarkMode = true;
//   searchTerm = '';

//   navItems = [
//     { icon: '⬡', label: 'Dashboard', active: true },
//     { icon: '👥', label: 'Employees', badge: 48, active: false },
//     { icon: '📋', label: 'Activities', active: false },
//     { icon: '📊', label: 'Analytics', active: false },
//     { icon: '🤖', label: 'AI Insights', active: false },
//     { icon: '🏆', label: 'Scoring', active: false },
//     { icon: '🕐', label: 'History', active: false },
//     { icon: '⚙️', label: 'Settings', active: false }
//   ];

//   kpiCards = [
//     {
//       label: 'Total Employees',
//       value: '248',
//       sub: 'Across 6 departments',
//       icon: '👥',
//       valueColor: 'var(--p2)',
//       iconBg: 'var(--pl)',
//       trend: '↑ 12% vs last month',
//       trendType: 'up'
//     },
//     {
//       label: 'Activities',
//       value: '183',
//       sub: 'Total this quarter',
//       icon: '⚡',
//       valueColor: 'var(--c1)',
//       iconBg: 'var(--c1l)',
//       trend: '↑ 8% vs last quarter',
//       trendType: 'up'
//     },
//     {
//       label: 'Open Tasks',
//       value: '47',
//       sub: 'Requires attention',
//       icon: '📂',
//       valueColor: 'var(--c2)',
//       iconBg: 'var(--c2l)',
//       trend: '↑ 3 new today',
//       trendType: 'down'
//     },
//     {
//       label: 'Completed',
//       value: '136',
//       sub: '74% completion rate',
//       icon: '✅',
//       valueColor: 'var(--c1)',
//       iconBg: 'var(--c1l)',
//       trend: '↑ 5% improvement',
//       trendType: 'up'
//     }
//   ];

//   activityStatuses = [
//     { name: 'Draft', value: 18, percent: 18, color: 'var(--mu)' },
//     { name: 'Open', value: 47, percent: 47, color: 'var(--p)' },
//     { name: 'In Progress', value: 38, percent: 38, color: 'var(--c2)' },
//     { name: 'Completed', value: 80, percent: 80, color: 'var(--c1)' }
//   ];

//   activityTypes = [
//     { name: 'Training', value: 68, color: 'var(--p)' },
//     { name: 'Certification', value: 32, color: 'var(--c1)' },
//     { name: 'Project', value: 47, color: 'var(--c2)' },
//     { name: 'Mission', value: 36, color: 'var(--c3)' }
//   ];

//   liveFeed = [
//     {
//       initials: 'SB',
//       name: 'Sarah B.',
//       badge: 'completed',
//       badgeClass: 'chip chip-g',
//       action: 'Angular Training module 4',
//       time: '2 min ago',
//       avatarBg: 'linear-gradient(135deg,#7c6af5,#9d8ff7)'
//     },
//     {
//       initials: 'KM',
//       name: 'Karim M.',
//       badge: 'started',
//       badgeClass: 'chip chip-p',
//       action: 'AWS Certification path',
//       time: '17 min ago',
//       avatarBg: 'linear-gradient(135deg,#00d4aa,#0891b2)'
//     },
//     {
//       initials: 'LT',
//       name: 'Lina T.',
//       badge: 'review',
//       badgeClass: 'chip chip-a',
//       action: 'Q3 Mission report draft',
//       time: '1 hr ago',
//       avatarBg: 'linear-gradient(135deg,#f59e0b,#ef4444)'
//     },
//     {
//       initials: 'AH',
//       name: 'Ali H.',
//       badge: 'overdue',
//       badgeClass: 'chip chip-r',
//       action: 'Security compliance test',
//       time: '3 hr ago',
//       avatarBg: 'linear-gradient(135deg,#f43f5e,#7c6af5)'
//     }
//   ];

//   employees = [
//     {
//       initials: 'SB',
//       name: 'Sarah Benali',
//       role: 'Frontend Dev',
//       department: 'Engineering',
//       deptClass: 'chip chip-p',
//       avatarBg: 'linear-gradient(135deg,#7c6af5,#9d8ff7)'
//     },
//     {
//       initials: 'KM',
//       name: 'Karim Mansouri',
//       role: 'DevOps Engineer',
//       department: 'Cloud',
//       deptClass: 'chip chip-g',
//       avatarBg: 'linear-gradient(135deg,#00d4aa,#0891b2)'
//     },
//     {
//       initials: 'LT',
//       name: 'Lina Trabelsi',
//       role: 'Product Manager',
//       department: 'Product',
//       deptClass: 'chip chip-a',
//       avatarBg: 'linear-gradient(135deg,#f59e0b,#ef4444)'
//     },
//     {
//       initials: 'AH',
//       name: 'Ali Hammami',
//       role: 'Security Analyst',
//       department: 'Security',
//       deptClass: 'chip chip-r',
//       avatarBg: 'linear-gradient(135deg,#f43f5e,#7c6af5)'
//     },
//     {
//       initials: 'NB',
//       name: 'Nour Bouaziz',
//       role: 'Data Scientist',
//       department: 'Data',
//       deptClass: 'chip chip-p',
//       avatarBg: 'linear-gradient(135deg,#8b5cf6,#06b6d4)'
//     }
//   ];

//   quickActions = [
//     { icon: '➕', title: 'New Activity', sub: 'Log HR event', iconBg: 'var(--pl)' },
//     { icon: '🤖', title: 'AI Recommend', sub: 'Smart insights', iconBg: 'rgba(244,63,94,.1)' },
//     { icon: '📊', title: 'Run Report', sub: 'Export analytics', iconBg: 'var(--c1l)' },
//     { icon: '🏆', title: 'Scoring', sub: 'Optimize ranking', iconBg: 'var(--c2l)' },
//     { icon: '👤', title: 'Add User', sub: 'Onboard employee', iconBg: 'rgba(90,100,120,.15)' },
//     { icon: '📅', title: 'Schedule', sub: 'Plan sessions', iconBg: 'rgba(99,102,241,.1)' }
//   ];

//   get totalActivities(): number {
//     return this.activityTypes.reduce((sum, item) => sum + item.value, 0);
//   }

//   get filteredEmployees() {
//     const term = this.searchTerm.trim().toLowerCase();
//     if (!term) {
//       return this.employees;
//     }

//     return this.employees.filter((employee) =>
//       employee.name.toLowerCase().includes(term) ||
//       employee.role.toLowerCase().includes(term) ||
//       employee.department.toLowerCase().includes(term)
//     );
//   }

//   toggleTheme(): void {
//     this.isDarkMode = !this.isDarkMode;
//   }
// }

// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { EmployeeService } from '../service/employee.service';
// import { Employee } from '../model/employee.model';
// import { DashboardService, DashboardStats } from '../service/dashboard.service';
// import { Router } from '@angular/router';
// import { VocalService } from '../service/vocal.service';
// import { TranslateService } from '@ngx-translate/core';
// import { ThemeService } from '../service/theme.service';

// @Component({
//   selector: 'app-hr-dashboard',
//   templateUrl: './hr-dashboard.component.html',
//   styleUrl: './hr-dashboard.component.css'
// })
// export class HrDashboardComponent implements OnInit {

//   employees: Employee[] = [];
//   employeeForm!: FormGroup;
//   showModal = false;
//   editMode = false;
//   selectedId: string | null = null;
//   loading = false;
//   error: string | null = null;

//   stats: DashboardStats = {
//     users: {
//       total: 0,
//       byRole: {
//         employees: 0,
//         managers: 0,
//         hrManagers: 0,
//         admins: 0
//       }
//     },
//     activities: {
//       total: 0,
//       byStatus: {
//         draft: 0,
//         open: 0,
//         inProgress: 0,
//         completed: 0,
//         cancelled: 0
//       },
//       byType: {
//         training: 0,
//         certification: 0,
//         project: 0,
//         mission: 0,
//         audit: 0
//       },
//       byCategory: {
//         technical: 0,
//         management: 0,
//         transversal: 0
//       },
//       totalSeats: 0,
//       recent: [],
//       monthly: []
//     }
//   };

//   isDarkMode = false;

//   searchFilters: any = {};

//   constructor(
//     private employeeService: EmployeeService,
//     private fb: FormBuilder,
//     private dashboardService: DashboardService,
//     private router: Router,
//     public vocalService: VocalService,
//     private translate: TranslateService,
//     private themeService: ThemeService
//   ) {}

//   ngOnInit(): void {
//     this.initForm();
//     this.initTheme();
//     this.loadEmployees();
//     this.dashboardService.getStats().subscribe({
//       next: (data: DashboardStats) => {
//         this.stats = data;
//         this.loading = false;
//       },
//       error: (err: any) => {
//         console.error('Dashboard HR error:', err);
//         this.loading = false;
//       }
//     });
//   }

//   // ── THEME ──────────────────────────────────────────────
//   initTheme(): void {
//     this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
//     this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
//   }

//   toggleTheme(): void {
//     this.themeService.toggleTheme();
//     this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
//   }

//   // ── FORM ───────────────────────────────────────────────
//   initForm(): void {
//     this.employeeForm = this.fb.group({
//       firstName:  ['', Validators.required],
//       lastName:   ['', Validators.required],
//       email:      ['', [Validators.required, Validators.email]],
//       jobTitle:   ['', Validators.required],
//       department: ['', Validators.required],
//       skills:     [[]]
//     });
//   }

//   // ── EMPLOYEES ──────────────────────────────────────────
//   loadEmployees(): void {
//     this.loading = true;
//     this.error = null;
//     this.employeeService.getEmployees(this.searchFilters).subscribe({
//       next: (res) => {
//         this.employees = res;
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = 'Erreur lors du chargement des employés: ' + err.message;
//         this.loading = false;
//         console.error('Error loading employees:', err);
//       }
//     });
//   }

//   applyFilters(): void {
//     this.loadEmployees();
//   }

//   // ── MODAL ──────────────────────────────────────────────
//   openModal(): void {
//     this.editMode = false;
//     this.selectedId = null;
//     this.employeeForm.reset();
//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.employeeForm.reset();
//     this.editMode = false;
//     this.selectedId = null;
//   }

//   closeOnBackdrop(): void {
//     this.closeModal();
//   }

//   // ── SUBMIT ─────────────────────────────────────────────
//   submitEmployee(): void {
//     if (this.employeeForm.invalid) return;

//     const formValue = this.employeeForm.value;

//     // Convert comma-separated string → array of skill objects
//     if (typeof formValue.skills === 'string') {
//       formValue.skills = formValue.skills
//         .split(',')
//         .map((skill: string) => ({ name: skill.trim(), level: 1 }));
//     }

//     if (this.editMode && this.selectedId) {
//       this.loading = true;
//       this.employeeService.updateEmployee(this.selectedId, formValue).subscribe({
//         next: () => {
//           this.loadEmployees();
//           this.closeModal();
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = 'Erreur lors de la mise à jour: ' + err.message;
//           this.loading = false;
//           console.error('Error updating employee:', err);
//         }
//       });
//     } else {
//       this.loading = true;
//       this.employeeService.createEmployee(formValue).subscribe({
//         next: (res) => {
//           this.employees = [...this.employees, res];
//           this.closeModal();
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = 'Erreur lors de la création: ' + err.message;
//           this.loading = false;
//           console.error('Error creating employee:', err);
//         }
//       });
//     }
//   }

//   // ── EDIT ───────────────────────────────────────────────
//   editEmployee(emp: Employee): void {
//     this.editMode = true;
//     this.selectedId = emp._id ?? null;

//     const skillsString = emp.skills
//       ? emp.skills.map((skill: any) => skill.name).join(', ')
//       : '';

//     this.employeeForm.patchValue({
//       firstName:  emp.firstName,
//       lastName:   emp.lastName,
//       email:      emp.email,
//       jobTitle:   emp.jobTitle,
//       department: emp.department,
//       skills:     skillsString
//     });
//     this.showModal = true;
//   }

//   // ── DELETE ─────────────────────────────────────────────
//   deleteEmployee(id?: string): void {
//     if (!id) return;
//     this.loading = true;
//     this.employeeService.deleteEmployee(id).subscribe({
//       next: () => {
//         this.employees = this.employees.filter(e => e._id !== id);
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = 'Erreur lors de la suppression: ' + err.message;
//         this.loading = false;
//         console.error('Error deleting employee:', err);
//       }
//     });
//   }

//   // ── NAVIGATION ─────────────────────────────────────────
//   navigateTo(path: string): void {
//     this.router.navigate([path]);
//   }

//   // ── HELPERS ────────────────────────────────────────────
//   getTypePercent(count: number): number {
//     const total = this.stats?.activities?.total || 1;
//     return Math.round((count / total) * 100);
//   }

//   getStatusPercent(count: number): number {
//     const total = this.stats?.activities?.total || 1;
//     return Math.round((count / total) * 100);
//   }

//   getTypeLabel(t: string): string {
//     const m: Record<string, string> = {
//       training: 'Formation', certification: 'Certification',
//       project: 'Projet', mission: 'Mission', audit: 'Audit',
//       TRAINING: 'Formation', CERTIFICATION: 'Certification',
//       PROJECT: 'Projet', MISSION: 'Mission', AUDIT: 'Audit'
//     };
//     return m[t] || t;
//   }

//   getStatusLabel(s: string): string {
//     const m: Record<string, string> = {
//       draft: 'Brouillon', open: 'Ouverte', inProgress: 'En cours',
//       completed: 'Terminée', cancelled: 'Annulée',
//       DRAFT: 'Brouillon', OPEN: 'Ouverte', IN_PROGRESS: 'En cours',
//       COMPLETED: 'Terminée', CANCELLED: 'Annulée'
//     };
//     return m[s] || s;
//   }

//   getStatusColor(s: string): string {
//     const m: Record<string, string> = {
//       draft: 'secondary', open: 'primary', inProgress: 'warning',
//       completed: 'success', cancelled: 'danger',
//       DRAFT: 'secondary', OPEN: 'primary', IN_PROGRESS: 'warning',
//       COMPLETED: 'success', CANCELLED: 'danger'
//     };
//     return m[s] || 'secondary';
//   }

//   speakText(text: string, lang: string = 'fr-FR'): void {
//     if (!text) return;
//     this.vocalService.speak(text, lang);
//   }
// }


// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { EmployeeService } from '../service/employee.service';
// import { Employee } from '../model/employee.model';
// import { DashboardService, DashboardStats, EmployeeResponseRow } from '../service/dashboard.service';
// import { Router } from '@angular/router';
// import { VocalService } from '../service/vocal.service';
// import { TranslateService } from '@ngx-translate/core';
// import { ThemeService } from '../service/theme.service';

// @Component({
//   selector: 'app-hr-dashboard',
//   templateUrl: './hr-dashboard.component.html',
//   styleUrl: './hr-dashboard.component.css'
// })
// export class HrDashboardComponent implements OnInit {

//   employees: Employee[] = [];
//   employeeForm!: FormGroup;
//   showModal = false;
//   editMode = false;
//   selectedId: string | null = null;
//   loading = false;
//   error: string | null = null;

//   employeeResponses: EmployeeResponseRow[] = [];
//   responsesLoading = false;
//   responsesError: string | null = null;

//   stats: DashboardStats = {
//     users: {
//       total: 0,
//       byRole: {
//         employees: 0,
//         managers: 0,
//         hrManagers: 0,
//         admins: 0
//       }
//     },
//     activities: {
//       total: 0,
//       byStatus: {
//         draft: 0,
//         open: 0,
//         inProgress: 0,
//         completed: 0,
//         cancelled: 0
//       },
//       byType: {
//         training: 0,
//         certification: 0,
//         project: 0,
//         mission: 0,
//         audit: 0
//       },
//       byCategory: {
//         technical: 0,
//         management: 0,
//         transversal: 0
//       },
//       totalSeats: 0,
//       recent: [],
//       monthly: []
//     }
//   };

//   isDarkMode = false;

//   searchFilters: any = {};

//   constructor(
//     private employeeService: EmployeeService,
//     private fb: FormBuilder,
//     private dashboardService: DashboardService,
//     private router: Router,
//     public vocalService: VocalService,
//     private translate: TranslateService,
//     private themeService: ThemeService
//   ) {}

//   ngOnInit(): void {
//     this.initForm();
//     this.initTheme();
//     this.loadEmployees();
//     this.loadEmployeeResponses();
//     this.dashboardService.getStats().subscribe({
//       next: (data: DashboardStats) => {
//         this.stats = data;
//         this.loading = false;
//       },
//       error: (err: any) => {
//         console.error('Dashboard HR error:', err);
//         this.loading = false;
//       }
//     });
//   }

//   // ── THEME ──────────────────────────────────────────────
//   initTheme(): void {
//     this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
//     this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
//   }

//   toggleTheme(): void {
//     this.themeService.toggleTheme();
//     this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
//   }

//   // ── FORM ───────────────────────────────────────────────
//   initForm(): void {
//     this.employeeForm = this.fb.group({
//       firstName:  ['', Validators.required],
//       lastName:   ['', Validators.required],
//       email:      ['', [Validators.required, Validators.email]],
//       jobTitle:   ['', Validators.required],
//       department: ['', Validators.required],
//       skills:     [[]]
//     });
//   }

//   // ── EMPLOYEES ──────────────────────────────────────────
//   loadEmployees(): void {
//     this.loading = true;
//     this.error = null;
//     this.employeeService.getEmployees(this.searchFilters).subscribe({
//       next: (res) => {
//         this.employees = res;
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = 'Erreur lors du chargement des employés: ' + err.message;
//         this.loading = false;
//         console.error('Error loading employees:', err);
//       }
//     });
//   }


//   loadEmployeeResponses(): void {
//     this.responsesLoading = true;
//     this.responsesError = null;

//     this.dashboardService.getEmployeeResponses().subscribe({
//       next: (rows: EmployeeResponseRow[]) => {
//         this.employeeResponses = rows || [];
//         this.responsesLoading = false;
//       },
//       error: (err: any) => {
//         console.error('Employee responses error:', err);
//         this.responsesError = 'Erreur lors du chargement des réponses employés.';
//         this.responsesLoading = false;
//       }
//     });
//   }

//   applyFilters(): void {
//     this.loadEmployees();
//   }

//   // ── MODAL ──────────────────────────────────────────────
//   openModal(): void {
//     this.editMode = false;
//     this.selectedId = null;
//     this.employeeForm.reset();
//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.employeeForm.reset();
//     this.editMode = false;
//     this.selectedId = null;
//   }

//   closeOnBackdrop(): void {
//     this.closeModal();
//   }

//   // ── SUBMIT ─────────────────────────────────────────────
//   submitEmployee(): void {
//     if (this.employeeForm.invalid) return;

//     const formValue = this.employeeForm.value;

//     // Convert comma-separated string → array of skill objects
//     if (typeof formValue.skills === 'string') {
//       formValue.skills = formValue.skills
//         .split(',')
//         .map((skill: string) => ({ name: skill.trim(), level: 1 }));
//     }

//     if (this.editMode && this.selectedId) {
//       this.loading = true;
//       this.employeeService.updateEmployee(this.selectedId, formValue).subscribe({
//         next: () => {
//           this.loadEmployees();
//           this.closeModal();
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = 'Erreur lors de la mise à jour: ' + err.message;
//           this.loading = false;
//           console.error('Error updating employee:', err);
//         }
//       });
//     } else {
//       this.loading = true;
//       this.employeeService.createEmployee(formValue).subscribe({
//         next: (res) => {
//           this.employees = [...this.employees, res];
//           this.closeModal();
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = 'Erreur lors de la création: ' + err.message;
//           this.loading = false;
//           console.error('Error creating employee:', err);
//         }
//       });
//     }
//   }

//   // ── EDIT ───────────────────────────────────────────────
//   editEmployee(emp: Employee): void {
//     this.editMode = true;
//     this.selectedId = emp._id ?? null;

//     const skillsString = emp.skills
//       ? emp.skills.map((skill: any) => skill.name).join(', ')
//       : '';

//     this.employeeForm.patchValue({
//       firstName:  emp.firstName,
//       lastName:   emp.lastName,
//       email:      emp.email,
//       jobTitle:   emp.jobTitle,
//       department: emp.department,
//       skills:     skillsString
//     });
//     this.showModal = true;
//   }

//   // ── DELETE ─────────────────────────────────────────────
//   deleteEmployee(id?: string): void {
//     if (!id) return;
//     this.loading = true;
//     this.employeeService.deleteEmployee(id).subscribe({
//       next: () => {
//         this.employees = this.employees.filter(e => e._id !== id);
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = 'Erreur lors de la suppression: ' + err.message;
//         this.loading = false;
//         console.error('Error deleting employee:', err);
//       }
//     });
//   }

//   // ── NAVIGATION ─────────────────────────────────────────
//   navigateTo(path: string): void {
//     this.router.navigate([path]);
//   }

//   // ── HELPERS ────────────────────────────────────────────
//   getTypePercent(count: number): number {
//     const total = this.stats?.activities?.total || 1;
//     return Math.round((count / total) * 100);
//   }

//   getStatusPercent(count: number): number {
//     const total = this.stats?.activities?.total || 1;
//     return Math.round((count / total) * 100);
//   }

//   getTypeLabel(t: string): string {
//     const m: Record<string, string> = {
//       training: 'Formation', certification: 'Certification',
//       project: 'Projet', mission: 'Mission', audit: 'Audit',
//       TRAINING: 'Formation', CERTIFICATION: 'Certification',
//       PROJECT: 'Projet', MISSION: 'Mission', AUDIT: 'Audit'
//     };
//     return m[t] || t;
//   }

//   getStatusLabel(s: string): string {
//     const m: Record<string, string> = {
//       draft: 'Brouillon', open: 'Ouverte', inProgress: 'En cours',
//       completed: 'Terminée', cancelled: 'Annulée',
//       DRAFT: 'Brouillon', OPEN: 'Ouverte', IN_PROGRESS: 'En cours',
//       COMPLETED: 'Terminée', CANCELLED: 'Annulée'
//     };
//     return m[s] || s;
//   }

//   getStatusColor(s: string): string {
//     const m: Record<string, string> = {
//       draft: 'secondary', open: 'primary', inProgress: 'warning',
//       completed: 'success', cancelled: 'danger',
//       DRAFT: 'secondary', OPEN: 'primary', IN_PROGRESS: 'warning',
//       COMPLETED: 'success', CANCELLED: 'danger'
//     };
//     return m[s] || 'secondary';
//   }


//   getResponseLabel(status: string): string {
//     const s = String(status || '').toUpperCase();
//     const map: Record<string, string> = {
//       ACCEPTED: 'Acceptée',
//       DECLINED: 'Refusée',
//       REFUSED: 'Refusée',
//       IN_PROGRESS: 'En cours',
//       COMPLETED: 'Terminée',
//       CERTIFIED: 'Certifiée'
//     };
//     return map[s] || s;
//   }

//   getResponseBadgeClass(status: string): string {
//     const s = String(status || '').toUpperCase();

//     if (s === 'ACCEPTED' || s === 'COMPLETED' || s === 'CERTIFIED') return 'b-grn';
//     if (s === 'DECLINED' || s === 'REFUSED') return 'b-red';
//     if (s === 'IN_PROGRESS') return 'b-amb';
//     return 'b-mu';
//   }

//   speakText(text: string, lang: string = 'fr-FR'): void {
//     if (!text) return;
//     this.vocalService.speak(text, lang);
//   }
// }

// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { EmployeeService } from '../service/employee.service';
// import { Employee } from '../model/employee.model';
// import { DashboardService, DashboardStats } from '../service/dashboard.service';
// import { Router } from '@angular/router';
// import { VocalService } from '../service/vocal.service';
// import { TranslateService } from '@ngx-translate/core';
// import { ThemeService } from '../service/theme.service';

// interface EmployeeResponseRow {
//   activityId: string;
//   activityTitle: string;
//   activityType: string;
//   activityCategory: string;
//   employeeName: string;
//   employeeEmail: string;
//   responseStatus: string;
//   justification: string;
//   selectedAt?: string | null;
//   respondedAt?: string | null;
// }

// @Component({
//   selector: 'app-hr-dashboard',
//   templateUrl: './hr-dashboard.component.html',
//   styleUrl: './hr-dashboard.component.css'
// })
// export class HrDashboardComponent implements OnInit {
//   employees: Employee[] = [];
//   employeeForm!: FormGroup;
//   showModal = false;
//   editMode = false;
//   selectedId: string | null = null;
//   loading = false;
//   error: string | null = null;

//   employeeResponses: EmployeeResponseRow[] = [];
//   responsesLoading = false;
//   responsesError: string | null = null;

//   stats: DashboardStats = {
//     users: {
//       total: 0,
//       byRole: {
//         employees: 0,
//         managers: 0,
//         hrManagers: 0,
//         admins: 0
//       }
//     },
//     activities: {
//       total: 0,
//       byStatus: {
//         draft: 0,
//         open: 0,
//         inProgress: 0,
//         completed: 0,
//         cancelled: 0
//       },
//       byType: {
//         training: 0,
//         certification: 0,
//         project: 0,
//         mission: 0,
//         audit: 0
//       },
//       byCategory: {
//         technical: 0,
//         management: 0,
//         transversal: 0
//       },
//       totalSeats: 0,
//       recent: [],
//       monthly: []
//     }
//   };

//   isDarkMode = false;
//   searchFilters: any = {};

//   constructor(
//     private employeeService: EmployeeService,
//     private fb: FormBuilder,
//     private dashboardService: DashboardService,
//     private router: Router,
//     public vocalService: VocalService,
//     private translate: TranslateService,
//     private themeService: ThemeService
//   ) {}

//   ngOnInit(): void {
//     this.initForm();
//     this.initTheme();
//     this.loadEmployees();
//     this.loadStats();
//     this.loadEmployeeResponses();
//   }

//   initTheme(): void {
//     this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
//     this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
//   }

//   toggleTheme(): void {
//     this.themeService.toggleTheme();
//     this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
//   }

//   initForm(): void {
//     this.employeeForm = this.fb.group({
//       firstName: ['', Validators.required],
//       lastName: ['', Validators.required],
//       email: ['', [Validators.required, Validators.email]],
//       jobTitle: ['', Validators.required],
//       department: ['', Validators.required],
//       skills: [[]]
//     });
//   }

//   loadStats(): void {
//     this.loading = true;
//     this.dashboardService.getStats().subscribe({
//       next: (data: DashboardStats) => {
//         this.stats = data;
//         this.loading = false;
//       },
//       error: (err: any) => {
//         console.error('Dashboard HR error:', err);
//         this.loading = false;
//       }
//     });
//   }

//   loadEmployeeResponses(): void {
//     this.responsesLoading = true;
//     this.responsesError = null;

//     const service = this.dashboardService as any;
//     if (typeof service.getEmployeeResponses !== 'function') {
//       this.responsesLoading = false;
//       this.responsesError = 'La méthode getEmployeeResponses() manque dans dashboard.service.ts';
//       return;
//     }

//     service.getEmployeeResponses().subscribe({
//       next: (rows: EmployeeResponseRow[]) => {
//         this.employeeResponses = Array.isArray(rows) ? rows : [];
//         this.responsesLoading = false;
//       },
//       error: (err: any) => {
//         console.error('Employee responses error:', err);
//         this.responsesError = 'Erreur lors du chargement des réponses employés.';
//         this.responsesLoading = false;
//       }
//     });
//   }

//   loadEmployees(): void {
//     this.loading = true;
//     this.error = null;
//     this.employeeService.getEmployees(this.searchFilters).subscribe({
//       next: (res) => {
//         this.employees = res;
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = 'Erreur lors du chargement des employés: ' + err.message;
//         this.loading = false;
//         console.error('Error loading employees:', err);
//       }
//     });
//   }

//   applyFilters(): void {
//     this.loadEmployees();
//   }

//   openModal(): void {
//     this.editMode = false;
//     this.selectedId = null;
//     this.employeeForm.reset();
//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.employeeForm.reset();
//     this.editMode = false;
//     this.selectedId = null;
//   }

//   closeOnBackdrop(): void {
//     this.closeModal();
//   }

//   submitEmployee(): void {
//     if (this.employeeForm.invalid) return;

//     const formValue = this.employeeForm.value;

//     if (typeof formValue.skills === 'string') {
//       formValue.skills = formValue.skills
//         .split(',')
//         .map((skill: string) => ({ name: skill.trim(), level: 1 }));
//     }

//     if (this.editMode && this.selectedId) {
//       this.loading = true;
//       this.employeeService.updateEmployee(this.selectedId, formValue).subscribe({
//         next: () => {
//           this.loadEmployees();
//           this.closeModal();
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = 'Erreur lors de la mise à jour: ' + err.message;
//           this.loading = false;
//           console.error('Error updating employee:', err);
//         }
//       });
//     } else {
//       this.loading = true;
//       this.employeeService.createEmployee(formValue).subscribe({
//         next: (res) => {
//           this.employees = [...this.employees, res];
//           this.closeModal();
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = 'Erreur lors de la création: ' + err.message;
//           this.loading = false;
//           console.error('Error creating employee:', err);
//         }
//       });
//     }
//   }

//   editEmployee(emp: Employee): void {
//     this.editMode = true;
//     this.selectedId = emp._id ?? null;

//     const skillsString = emp.skills
//       ? emp.skills.map((skill: any) => skill.name).join(', ')
//       : '';

//     this.employeeForm.patchValue({
//       firstName: emp.firstName,
//       lastName: emp.lastName,
//       email: emp.email,
//       jobTitle: emp.jobTitle,
//       department: emp.department,
//       skills: skillsString
//     });
//     this.showModal = true;
//   }

//   deleteEmployee(id?: string): void {
//     if (!id) return;
//     this.loading = true;
//     this.employeeService.deleteEmployee(id).subscribe({
//       next: () => {
//         this.employees = this.employees.filter(e => e._id !== id);
//         this.loading = false;
//       },
//       error: (err) => {
//         this.error = 'Erreur lors de la suppression: ' + err.message;
//         this.loading = false;
//         console.error('Error deleting employee:', err);
//       }
//     });
//   }

//   navigateTo(path: string): void {
//     this.router.navigate([path]);
//   }

//   getTypePercent(count: number): number {
//     const total = this.stats?.activities?.total || 1;
//     return Math.round((count / total) * 100);
//   }

//   getStatusPercent(count: number): number {
//     const total = this.stats?.activities?.total || 1;
//     return Math.round((count / total) * 100);
//   }

//   getTypeLabel(t: string): string {
//     const m: Record<string, string> = {
//       training: 'Formation',
//       certification: 'Certification',
//       project: 'Projet',
//       mission: 'Mission',
//       audit: 'Audit',
//       TRAINING: 'Formation',
//       CERTIFICATION: 'Certification',
//       PROJECT: 'Projet',
//       MISSION: 'Mission',
//       AUDIT: 'Audit'
//     };
//     return m[t] || t;
//   }

//   getStatusLabel(s: string): string {
//     const m: Record<string, string> = {
//       draft: 'Brouillon',
//       open: 'Ouverte',
//       inProgress: 'En cours',
//       completed: 'Terminée',
//       cancelled: 'Annulée',
//       DRAFT: 'Brouillon',
//       OPEN: 'Ouverte',
//       IN_PROGRESS: 'En cours',
//       COMPLETED: 'Terminée',
//       CANCELLED: 'Annulée'
//     };
//     return m[s] || s;
//   }

//   getStatusColor(s: string): string {
//     const m: Record<string, string> = {
//       draft: 'secondary',
//       open: 'primary',
//       inProgress: 'warning',
//       completed: 'success',
//       cancelled: 'danger',
//       DRAFT: 'secondary',
//       OPEN: 'primary',
//       IN_PROGRESS: 'warning',
//       COMPLETED: 'success',
//       CANCELLED: 'danger'
//     };
//     return m[s] || 'secondary';
//   }

//   getResponseLabel(status: string): string {
//     const s = String(status || '').toUpperCase();
//     const map: Record<string, string> = {
//       ACCEPTED: 'Acceptée',
//       DECLINED: 'Refusée',
//       REFUSED: 'Refusée',
//       IN_PROGRESS: 'En cours',
//       COMPLETED: 'Terminée',
//       CERTIFIED: 'Certifiée'
//     };
//     return map[s] || s;
//   }

//   getResponseBadgeClass(status: string): string {
//     const s = String(status || '').toUpperCase();
//     if (s === 'ACCEPTED' || s === 'COMPLETED' || s === 'CERTIFIED') return 'b-grn';
//     if (s === 'DECLINED' || s === 'REFUSED') return 'b-red';
//     if (s === 'IN_PROGRESS') return 'b-amb';
//     return 'b-mu';
//   }

//   speakText(text: string, lang: string = 'fr-FR'): void {
//     if (!text) return;
//     this.vocalService.speak(text, lang);
//   }
// }


import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { EmployeeService } from '../service/employee.service';
import { Employee } from '../model/employee.model';
import { DashboardService, DashboardStats } from '../service/dashboard.service';
import { NotificationService } from '../service/notification.service';
import { VocalService } from '../service/vocal.service';
import { ThemeService } from '../service/theme.service';

interface EmployeeResponseRow {
  activityId: string;
  activityTitle: string;
  activityType: string;
  activityCategory: string;
  employeeName: string;
  employeeEmail: string;
  responseStatus: string;
  justification: string;
  selectedAt?: string | null;
  respondedAt?: string | null;
}

interface CertificationApprovalRow {
  activityId: string;
  activityTitle: string;
  employeeId?: string | null;
  userId?: string | null;
  employeeName: string;
  employeeEmail: string;
  completedAt?: string | null;
  status: string;
}

@Component({
  selector: 'app-hr-dashboard',
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.css']
})
export class HrDashboardComponent implements OnInit {
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

  certificationApprovals: CertificationApprovalRow[] = [];
  approvalsLoading = false;
  approvalsError: string | null = null;

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

  isDarkMode = false;
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
    private notificationService: NotificationService,
    private router: Router,
    public vocalService: VocalService,
    private translate: TranslateService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initTheme();
    this.loadEmployees();
    this.loadStats();
    this.loadEmployeeResponses();
    this.loadCertificationApprovals();
  }

  initTheme(): void {
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
    this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
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
    this.loading = true;

    this.dashboardService.getStats().subscribe({
      next: (data: DashboardStats): void => {
        this.stats = data;
        this.loading = false;
      },
      error: (err: unknown): void => {
        console.error('Dashboard HR error:', err);
        this.loading = false;
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
        console.error('Employee responses error:', err);
        this.responsesError = 'Erreur lors du chargement des réponses employés.';
        this.responsesLoading = false;
      }
    });
  }

  loadCertificationApprovals(): void {
    this.approvalsLoading = true;
    this.approvalsError = null;

    this.notificationService.getCertificationApprovals().subscribe({
      next: (rows: CertificationApprovalRow[]): void => {
        this.certificationApprovals = Array.isArray(rows) ? rows : [];
        this.approvalsLoading = false;
      },
      error: (err: unknown): void => {
        console.error('Certification approvals error:', err);
        this.approvalsError = 'Erreur lors du chargement des validations certification.';
        this.approvalsLoading = false;
      }
    });
  }

  approveCertification(row: CertificationApprovalRow): void {
    this.notificationService.approveCertification({
      activityId: row.activityId,
      userId: row.userId || undefined,
      employeeId: row.employeeId || undefined,
      certificateUrl: ''
    }).subscribe({
      next: (): void => {
        this.certificationApprovals = this.certificationApprovals.filter(
          (r: CertificationApprovalRow) =>
            !(
              r.activityId === row.activityId &&
              (
                String(r.userId || '') === String(row.userId || '') ||
                String(r.employeeId || '') === String(row.employeeId || '')
              )
            )
        );

        this.loadEmployeeResponses();
      },
      error: (err: unknown): void => {
        console.error('Approve certification error:', err);
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
    if (this.employeeForm.invalid) {
      return;
    }

    const formValue: any = { ...this.employeeForm.value };

    if (typeof formValue.skills === 'string') {
      formValue.skills = formValue.skills
        .split(',')
        .map((skill: string) => ({ name: skill.trim(), level: 1 }));
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
    const m: Record<string, string> = {
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
    return m[t] || t;
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = {
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
    return m[s] || s;
  }

  getStatusColor(s: string): string {
    const m: Record<string, string> = {
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
    return m[s] || 'secondary';
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

    if (s === 'ACCEPTED' || s === 'COMPLETED' || s === 'CERTIFIED') return 'b-grn';
    if (s === 'DECLINED' || s === 'REFUSED') return 'b-red';
    if (s === 'IN_PROGRESS') return 'b-amb';
    return 'b-mu';
  }

  speakText(text: string, lang: string = 'fr-FR'): void {
    if (!text) return;
    this.vocalService.speak(text, lang);
  }


 

switchLanguage(lang: string) {
this. translate.use(lang);}
}