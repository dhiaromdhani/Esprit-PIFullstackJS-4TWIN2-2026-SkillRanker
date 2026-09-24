// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
// import { Activity, ActivityService } from '../service/activity.service';

// @Component({
//   selector: 'app-activite',
//   templateUrl: './activite.component.html',
//   styleUrls: ['./activite.component.css']
// })
// export class ActiviteComponent implements OnInit {

//   activities: Activity[] = [];
//   filteredActivities: Activity[] = [];
//   selectedActivity: Activity | null = null;

//   activityForm!: FormGroup;
//   showModal = false;
//   editMode = false;
//   selectedId: string | null = null;

//   showDetail = false;

//   // Filters
//   filterType = '';
//   filterStatus = '';
//   filterCategory = '';
//   searchText = '';

//   // Dropdown options
//   types = [
//     { value: 'TRAINING',      label: 'Formation' },
//     { value: 'CERTIFICATION', label: 'Certification' },
//     { value: 'PROJECT',       label: 'Projet' },
//     { value: 'MISSION',       label: 'Mission' },
//     { value: 'AUDIT',         label: 'Audit' }
//   ];

//   categories = [
//     { value: 'TECHNICAL',    label: 'Technique' },
//     { value: 'MANAGEMENT',   label: 'Management' },
//     { value: 'TRANSVERSAL',  label: 'Transversal' }
//   ];

//   priorities = [
//     { value: 'UPSKILLING',   label: 'Upskilling (priorité aux profils bas)' },
//     { value: 'EXPERTISE',    label: 'Expertise (priorité aux experts)' },
//     { value: 'DEVELOPMENT',  label: 'Développement (profils intermédiaires)' }
//   ];

//   statuses = [
//     { value: 'DRAFT',       label: 'Brouillon',  color: 'secondary' },
//     { value: 'OPEN',        label: 'Ouverte',    color: 'primary' },
//     { value: 'IN_PROGRESS', label: 'En cours',   color: 'warning' },
//     { value: 'COMPLETED',   label: 'Terminée',   color: 'success' },
//     { value: 'CANCELLED',   label: 'Annulée',    color: 'danger' }
//   ];

//   skillTypes = [
//     { value: 'KNOWLEDGE',  label: 'Savoir' },
//     { value: 'KNOW_HOW',   label: 'Savoir-faire' },
//     { value: 'SOFT_SKILL', label: 'Savoir-être' }
//   ];

//   skillLevels = [
//     { value: 'LOW',    label: 'Bas' },
//     { value: 'MEDIUM', label: 'Moyen' },
//     { value: 'HIGH',   label: 'Élevé' },
//     { value: 'EXPERT', label: 'Expert' }
//   ];

//   constructor(
//     private activityService: ActivityService,
//     private fb: FormBuilder
//   ) {}

//   ngOnInit(): void {
//     this.initForm();
//     this.loadActivities();
//   }

//   // ===================== FORM =====================
//   initForm(): void {
//     this.activityForm = this.fb.group({
//       title:           ['', Validators.required],
//       description:     [''],
//       type:            ['TRAINING', Validators.required],
//       category:        ['TECHNICAL'],
//       seats:           [5, [Validators.required, Validators.min(1)]],
//       priorityContext: ['UPSKILLING'],
//       location:        [''],
//       startDate:       [''],
//       endDate:         [''],
//       duration:        [''],
//       requiredSkills:  this.fb.array([])
//     });
//   }

//   get requiredSkills(): FormArray {
//     return this.activityForm.get('requiredSkills') as FormArray;
//   }

//   addSkill(): void {
//     this.requiredSkills.push(this.fb.group({
//       name:         ['', Validators.required],
//       type:         ['KNOWLEDGE', Validators.required],
//       desiredLevel: ['MEDIUM', Validators.required],
//       weight:       [1, [Validators.min(1), Validators.max(10)]]
//     }));
//   }

//   removeSkill(index: number): void {
//     this.requiredSkills.removeAt(index);
//   }

//   // ===================== DATA =====================
//   loadActivities(): void {
//     const filters: any = {};
//     if (this.filterType)     filters.type = this.filterType;
//     if (this.filterStatus)   filters.status = this.filterStatus;
//     if (this.filterCategory) filters.category = this.filterCategory;

//     this.activityService.getActivities(filters).subscribe({
//       next: (res: Activity[]) => {
//         this.activities = res || [];
//         this.applySearch();
//       },
//       error: (err) => console.error('Error loading activities:', err)
//     });
//   }

//   applySearch(): void {
//     if (!this.searchText?.trim()) {
//       this.filteredActivities = [...this.activities];
//     } else {
//       const s = this.searchText.toLowerCase();
//       this.filteredActivities = this.activities.filter(a =>
//         a.title?.toLowerCase().includes(s) ||
//         a.description?.toLowerCase().includes(s) ||
//         a.location?.toLowerCase().includes(s)
//       );
//     }
//   }

//   onFilterChange(): void {
//     this.loadActivities();
//   }

//   clearFilters(): void {
//     this.filterType = '';
//     this.filterStatus = '';
//     this.filterCategory = '';
//     this.searchText = '';
//     this.loadActivities();
//   }

//   // ===================== MODAL =====================
//   openModal(): void {
//     this.editMode = false;
//     this.selectedId = null;
//     this.activityForm.reset({
//       type: 'TRAINING',
//       category: 'TECHNICAL',
//       seats: 5,
//       priorityContext: 'UPSKILLING'
//     });
//     this.requiredSkills.clear();
//     this.showModal = true;
//   }

//   editActivity(act: Activity): void {
//     this.editMode = true;
//     this.selectedId = act._id ?? null;

//     this.activityForm.patchValue({
//       title: act.title,
//       description: act.description || '',
//       type: act.type || 'TRAINING',
//       category: act.category || 'TECHNICAL',
//       seats: act.seats || 5,
//       priorityContext: act.priorityContext || 'UPSKILLING',
//       location: act.location || '',
//       startDate: act.startDate ? act.startDate.substring(0, 10) : '',
//       endDate: act.endDate ? act.endDate.substring(0, 10) : '',
//       duration: act.duration || ''
//     });

//     this.requiredSkills.clear();
//     if (act.requiredSkills?.length) {
//       act.requiredSkills.forEach(sk => {
//         this.requiredSkills.push(this.fb.group({
//           name: [sk.name, Validators.required],
//           type: [sk.type, Validators.required],
//           desiredLevel: [sk.desiredLevel, Validators.required],
//           weight: [sk.weight || 1]
//         }));
//       });
//     }

//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.editMode = false;
//     this.selectedId = null;
//     this.activityForm.reset();
//     this.requiredSkills.clear();
//   }

//   submitActivity(): void {
//     if (this.activityForm.invalid) {
//       this.activityForm.markAllAsTouched();
//       return;
//     }

//     const data = this.activityForm.value;

//     if (this.editMode && this.selectedId) {
//       this.activityService.updateActivity(this.selectedId, data).subscribe({
//         next: () => {
//           this.loadActivities();
//           this.closeModal();
//         },
//         error: (err) => console.error('Update error:', err)
//       });
//     } else {
//       this.activityService.createActivity(data).subscribe({
//         next: () => {
//           this.loadActivities();
//           this.closeModal();
//         },
//         error: (err) => console.error('Create error:', err)
//       });
//     }
//   }

//   // ===================== ACTIONS =====================
//   deleteActivity(id?: string): void {
//     if (!id || !confirm('Voulez-vous vraiment supprimer cette activité ?')) return;

//     this.activityService.deleteActivity(id).subscribe({
//       next: () => {
//         this.loadActivities();
//         if (this.selectedActivity?._id === id) {
//           this.closeDetail();
//         }
//       },
//       error: (err) => console.error('Delete error:', err)
//     });
//   }

//   changeStatus(id: string, newStatus: string): void {
//     this.activityService.updateStatus(id, newStatus).subscribe({
//       next: () => {
//         this.loadActivities();
//         if (this.selectedActivity?._id === id) {
//           this.viewDetail(id);
//         }
//       },
//       error: (err) => console.error('Status change error:', err)
//     });
//   }

//   viewDetail(id: string): void {
//     this.activityService.getActivityById(id).subscribe({
//       next: (act) => {
//         this.selectedActivity = act;
//         this.showDetail = true;
//       },
//       error: (err) => console.error('Detail error:', err)
//     });
//   }

//   closeDetail(): void {
//     this.showDetail = false;
//     this.selectedActivity = null;
//   }

//   // ===================== HELPERS =====================
//   getTypeLabel(value?: string): string {
//     return this.types.find(t => t.value === value)?.label || value || '—';
//   }

//   getCategoryLabel(value?: string): string {
//     return this.categories.find(c => c.value === value)?.label || value || '—';
//   }

//   getStatusColor(status?: string): string {
//     return this.statuses.find(s => s.value === status)?.color || 'secondary';
//   }

//   getStatusLabel(status?: string): string {
//     return this.statuses.find(s => s.value === status)?.label || status || 'Brouillon';
//   }

//   getPriorityLabel(value?: string): string {
//     return this.priorities.find(p => p.value === value)?.label || value || '—';
//   }

//   getSkillTypeLabel(value?: string): string {
//     return this.skillTypes.find(s => s.value === value)?.label || value || '—';
//   }

//   getLevelLabel(value?: string): string {
//     return this.skillLevels.find(l => l.value === value)?.label || value || '—';
//   }
// }
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Activity, ActivityService } from '../service/activity.service';

@Component({
  selector: 'app-activite',
  templateUrl: './activite.component.html',
  styleUrls: ['./activite.component.css']
})
export class ActiviteComponent implements OnInit {

  activities: Activity[] = [];
  filteredActivities: Activity[] = [];
  selectedActivity: Activity | null = null;

  activityForm!: FormGroup;
  showModal = false;
  editMode = false;
  selectedId: string | null = null;
  showDetail = false;

  // Filtres
  filterType = '';
  filterStatus = '';
  filterCategory = '';
  searchText = '';

  // Options pour les selects
  types = [
    { value: 'TRAINING',      label: 'Formation' },
    { value: 'CERTIFICATION', label: 'Certification' },
    { value: 'PROJECT',       label: 'Projet' },
    { value: 'MISSION',       label: 'Mission' },
    { value: 'AUDIT',         label: 'Audit' }
  ];

  categories = [
    { value: 'TECHNICAL',    label: 'Technique' },
    { value: 'MANAGEMENT',   label: 'Management' },
    { value: 'TRANSVERSAL',  label: 'Transversal' }
  ];

  priorities = [
    { value: 'UPSKILLING',   label: 'Upskilling (priorité aux profils bas)' },
    { value: 'EXPERTISE',    label: 'Expertise (priorité aux experts)' },
    { value: 'DEVELOPMENT',  label: 'Développement (profils intermédiaires)' }
  ];

  statuses = [
    { value: 'DRAFT',       label: 'Brouillon',  color: 'secondary' },
    { value: 'OPEN',        label: 'Ouverte',    color: 'primary' },
    { value: 'IN_PROGRESS', label: 'En cours',   color: 'warning' },
    { value: 'COMPLETED',   label: 'Terminée',   color: 'success' },
    { value: 'CANCELLED',   label: 'Annulée',    color: 'danger' }
  ];

  skillTypes = [
    { value: 'KNOWLEDGE',  label: 'Savoir' },
    { value: 'KNOW_HOW',   label: 'Savoir-faire' },
    { value: 'SOFT_SKILL', label: 'Savoir-être' }
  ];

  skillLevels = [
    { value: 'LOW',    label: 'Bas' },
    { value: 'MEDIUM', label: 'Moyen' },
    { value: 'HIGH',   label: 'Élevé' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  constructor(
    private activityService: ActivityService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadActivities();
  }

  // ===================== FORMULAIRE AVEC CONTRÔLE DE SAISIE =====================
  initForm(): void {
    this.activityForm = this.fb.group({
      title:           ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      description:     ['', [Validators.required,Validators.maxLength(500)]],
      type:            ['TRAINING', Validators.required],
      category:        ['TECHNICAL'],
      seats:           [5, [Validators.required, Validators.min(1), Validators.max(100)]],
      priorityContext: ['UPSKILLING', Validators.required],
      location: ['', [Validators.required, Validators.maxLength(100)]],
      startDate:       [''],
      endDate:         [''],
      duration:        ['', [Validators.maxLength(50)]],
      requiredSkills:  this.fb.array([], this.minOneSkillValidator()) // Contrôle personnalisé
    });
  }

  // Validateur personnalisé : au moins une compétence requise
  minOneSkillValidator() {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const formArray = control as FormArray;
      return formArray.length >= 1 ? null : { atLeastOneSkill: true };
    };
  }

  get requiredSkills(): FormArray {
    return this.activityForm.get('requiredSkills') as FormArray;
  }

  addSkill(): void {
    this.requiredSkills.push(this.fb.group({
      name:         ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      type:         ['KNOWLEDGE', Validators.required],
      desiredLevel: ['MEDIUM', Validators.required],
      weight:       [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    }));
  }

  removeSkill(index: number): void {
    this.requiredSkills.removeAt(index);
  }

  // ===================== CHARGEMENT DES DONNÉES =====================
  loadActivities(): void {
    const filters: any = {};
    if (this.filterType)     filters.type = this.filterType;
    if (this.filterStatus)   filters.status = this.filterStatus;
    if (this.filterCategory) filters.category = this.filterCategory;

    this.activityService.getActivities(filters).subscribe({
      next: (res) => {
        this.activities = res || [];
        this.applySearch();
      },
      error: (err) => console.error('Erreur chargement activités:', err)
    });
  }

  applySearch(): void {
    if (!this.searchText?.trim()) {
      this.filteredActivities = [...this.activities];
    } else {
      const s = this.searchText.toLowerCase().trim();
      this.filteredActivities = this.activities.filter(a =>
        a.title?.toLowerCase().includes(s) ||
        a.description?.toLowerCase().includes(s) ||
        a.location?.toLowerCase().includes(s)
      );
    }
  }

  onFilterChange(): void {
    this.loadActivities();
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterStatus = '';
    this.filterCategory = '';
    this.searchText = '';
    this.loadActivities();
  }

  // ===================== MODAL =====================
  openModal(): void {
    this.editMode = false;
    this.selectedId = null;
    this.activityForm.reset({
      type: 'TRAINING',
      category: 'TECHNICAL',
      seats: 5,
      priorityContext: 'UPSKILLING'
    });
    this.requiredSkills.clear();
    this.showModal = true;
  }

  editActivity(act: Activity): void {
    this.editMode = true;
    this.selectedId = act._id ?? null;

    this.activityForm.patchValue({
      title:           act.title,
      description:     act.description || '',
      type:            act.type || 'TRAINING',
      category:        act.category || 'TECHNICAL',
      seats:           act.seats || 5,
      priorityContext: act.priorityContext || 'UPSKILLING',
      location:        act.location || '',
      startDate:       act.startDate ? act.startDate.substring(0, 10) : '',
      endDate:         act.endDate ? act.endDate.substring(0, 10) : '',
      duration:        act.duration || ''
    });

    this.requiredSkills.clear();
    if (act.requiredSkills && act.requiredSkills.length > 0) {
      act.requiredSkills.forEach(sk => {
        this.requiredSkills.push(this.fb.group({
          name:         [sk.name, [Validators.required, Validators.minLength(2)]],
          type:         [sk.type, Validators.required],
          desiredLevel: [sk.desiredLevel, Validators.required],
          weight:       [sk.weight || 1, [Validators.required, Validators.min(1), Validators.max(10)]]
        }));
      });
    } else {
      this.addSkill(); // Ajoute une compétence par défaut en mode édition si aucune
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editMode = false;
    this.selectedId = null;
    this.activityForm.reset();
    this.requiredSkills.clear();
  }
errorMessage = '';
  // ===================== SOUMISSION AVEC CONTRÔLE =====================
  submitActivity(): void {
    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      return;
    }

    const data = this.activityForm.value;

    if (this.editMode && this.selectedId) {
      this.activityService.updateActivity(this.selectedId, data).subscribe({
        next: () => {
          alert('✅ Activité modifiée avec succès !');
          this.loadActivities();
          this.closeModal();
          if (this.selectedActivity?._id === this.selectedId) {
            this.viewDetail(this.selectedId!);
          }
        },
        error: (err) => {
          console.error(err);
          alert('❌ Erreur lors de la modification');
        }
      });
    } else {
      this.activityService.createActivity(data).subscribe({
        next: () => {
          alert('✅ Activité créée avec succès !');
          this.loadActivities();
          this.closeModal();
        },
        // error: (err) => {
        //   console.error(err);
        //   alert('❌ Erreur lors de la création');
        // }
        error: (err: any) => {
  console.error('Erreur création activité:', err);
  console.error('Message backend activité:', err?.error);

  this.errorMessage =
    err?.error?.message ||
    err?.error?.error ||
    'Erreur lors de la création de l’activité';
}
      });
    }
  }

  // ===================== AUTRES ACTIONS =====================
  deleteActivity(id?: string): void {
    if (!id || !confirm('Voulez-vous vraiment supprimer cette activité ?')) return;

    this.activityService.deleteActivity(id).subscribe({
      next: () => {
        this.loadActivities();
        if (this.selectedActivity?._id === id) this.closeDetail();
      },
      error: (err) => console.error('Delete error:', err)
    });
  }

  changeStatus(id: string, newStatus: string): void {
    this.activityService.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.loadActivities();
        if (this.selectedActivity?._id === id) this.viewDetail(id);
      },
      error: (err) => console.error('Status error:', err)
    });
  }

  viewDetail(id: string): void {
    this.activityService.getActivityById(id).subscribe({
      next: (act) => {
        this.selectedActivity = act;
        this.showDetail = true;
      },
      error: (err) => console.error('Detail error:', err)
    });
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedActivity = null;
  }

  // ===================== HELPERS =====================
  getTypeLabel(value?: string): string {
    return this.types.find(t => t.value === value)?.label || value || '—';
  }

  getCategoryLabel(value?: string): string {
    return this.categories.find(c => c.value === value)?.label || value || '—';
  }

  getStatusColor(status?: string): string {
    return this.statuses.find(s => s.value === status)?.color || 'secondary';
  }

  getStatusLabel(status?: string): string {
    return this.statuses.find(s => s.value === status)?.label || status || 'Brouillon';
  }

  getPriorityLabel(value?: string): string {
    return this.priorities.find(p => p.value === value)?.label || value || '—';
  }

  getSkillTypeLabel(value?: string): string {
    return this.skillTypes.find(s => s.value === value)?.label || value || '—';
  }

  getLevelLabel(value?: string): string {
    return this.skillLevels.find(l => l.value === value)?.label || value || '—';
  }

  // Méthode utile pour afficher les erreurs dans le template
  hasError(controlName: string, errorType: string): boolean {
    const control = this.activityForm.get(controlName);
    return !!(control?.hasError(errorType) && (control.touched || control.dirty));
  }
}