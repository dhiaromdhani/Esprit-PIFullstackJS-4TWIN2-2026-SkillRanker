import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { DashboardService, DashboardStats } from '../../service/dashboard.service';
import { UserService } from '../../service/user.service';
import { VocalService } from '../../service/vocal.service';

interface CreateUserResponse {
  message?: string;
  user?: any;        // ou tu peux créer une interface User plus précise
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  employees: any[] = [];
  employeeForm!: FormGroup;
  showModal = false;
  editMode = false;
  selectedId: string | null = null;

  loadingStats = true;
  loadingEmployees = true;
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
  searchFilters: any = {};

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dashboardService: DashboardService,
    private router: Router,
    public vocalService: VocalService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDashboardStats();
    this.getUsers();
  }

//   speakText(text: string, lang: string = 'fr-FR'): void {
//   if (!text) return;
//   this.vocalService.speak(text, lang);
// }
voiceLanguage: string = 'fr-FR';

speakDashboard(): void {

  const text =
    `Bonjour. Voici le résumé du dashboard.
    
    Nombre total d'utilisateurs: ${this.stats?.users?.total || 0}.
    
    Activités totales: ${this.stats?.activities?.total || 0}.
    
    Activités ouvertes: ${this.stats?.activities?.byStatus?.open || 0}.
    
    Activités terminées: ${this.stats?.activities?.byStatus?.completed || 0}.
    
    Vous avez actuellement ${this.employees?.length || 0} employés dans le système.
    
    Merci d'utiliser le système de gestion des ressources humaines.`;

  this.vocalService.speak(text, this.voiceLanguage);
}
  initForm(): void {
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: ['', Validators.required],
      role: ['EMPLOYEE', Validators.required]
    });
  }

  loadDashboardStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loadingStats = false;
      },
      error: (err) => {
        console.error('Erreur stats:', err);
        this.loadingStats = false;
      }
    });
  }

  getUsers(): void {
    this.loadingEmployees = true;
    this.error = null;

    this.userService.getUsers().subscribe({
      next: (res) => {
        this.employees = res;
        this.loadingEmployees = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loadingEmployees = false;
        console.error(err);
      }
    });
  }

  openModal(): void {
    this.editMode = false;
    this.selectedId = null;
    this.employeeForm.reset({ role: 'EMPLOYEE' });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editMode = false;
    this.selectedId = null;
  }

  // ====================== SUBMIT (FIXED) ======================
  submitEmployee(): void {
    if (this.employeeForm.invalid) return;

    const formValue = this.employeeForm.value;

    const userData = {
      email: formValue.email,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      jobTitle: formValue.jobTitle,
      role: formValue.role
    };

    if (this.editMode && this.selectedId) {
      // Update
      this.userService.updateUser(this.selectedId, userData).subscribe({
        next: () => {
          this.getUsers();
          this.closeModal();
          alert('Utilisateur mis à jour avec succès !');
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('Erreur lors de la mise à jour');
        }
      });
    } else {
      // Create - Correction ici
      this.userService.createUser(userData).subscribe({
        next: (response: any) => {                    // any ou CreateUserResponse
          // Gestion des deux cas possibles :
          // 1. { message: "...", user: {...} }
          // 2. Directement l'objet user
          const newUser = response.user || response;

          if (newUser) {
            this.employees.unshift(newUser);   // Ajouter au début de la liste
            this.closeModal();
            alert('Utilisateur créé avec succès ! Un email a été envoyé.');
          }
        },
        error: (err) => {
          console.error('Create error:', err);
          alert('Erreur lors de la création de l\'utilisateur : ' + (err.error?.message || err.message));
        }
      });
    }
  }

  editEmployee(emp: any): void {
    this.editMode = true;
    this.selectedId = emp._id;

    this.employeeForm.patchValue({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle,
      role: emp.role || 'EMPLOYEE'
    });

    this.showModal = true;
  }

  deleteEmployee(id?: string): void {
    if (!id || !confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e._id !== id);
        alert('Utilisateur supprimé avec succès');
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Erreur lors de la suppression');
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}