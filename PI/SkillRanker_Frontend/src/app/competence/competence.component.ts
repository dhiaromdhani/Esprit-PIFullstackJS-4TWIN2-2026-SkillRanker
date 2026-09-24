import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CompetenceService, Competence } from '../service/competence.service';
import { VocalService } from '../service/vocal.service';
@Component({
  selector: 'app-competence',
  templateUrl: './competence.component.html',
  styleUrl: './competence.component.css'
})
// export class CompetenceComponent {

// }
export class CompetenceComponent implements OnInit {

  competences: Competence[] = [];

  showModal = false;
  editMode = false;
  selectedId: string | null = null;

  form: FormGroup;

  constructor(
    private service: CompetenceService,
    private fb: FormBuilder,
    public vocalService: VocalService
  ) {
    this.form = this.fb.group({
      fiches_id: [''],
      question_competence_id: [''],
      type: [''],
      intitule: [''],
      auto_eval: [0],
      hierarchie_eval: [0],
      etat: ['draft']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(res => this.competences = res);
  }

  openModal() {
    this.showModal = true;
    this.editMode = false;
    this.form.reset({ etat: 'draft' });
  }

  closeModal() {
    this.showModal = false;
  }

  submit() {

    const data = this.form.value;

    if (this.editMode && this.selectedId) {
      this.service.update(this.selectedId, data)
        .subscribe(() => this.load());
    } else {
      this.service.create(data)
        .subscribe(() => this.load());
    }

    this.closeModal();
  }

  edit(c: Competence) {
    this.selectedId = c._id!;
    this.editMode = true;
    this.showModal = true;
    this.form.patchValue(c);
  }

  delete(id?: string) {
    if (!id) return;
    this.service.delete(id).subscribe(() => this.load());
  }
}