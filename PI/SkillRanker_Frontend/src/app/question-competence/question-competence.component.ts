import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { QuestionCompetenceService, QuestionCompetence } from '../service/question-competence.service';

@Component({
  selector: 'app-question-competence',
  templateUrl: './question-competence.component.html',
  styleUrl: './question-competence.component.css'
})
export class QuestionCompetenceComponent implements OnInit {
questions: QuestionCompetence[] = [];

  showModal = false;
  form: FormGroup;
  selectedId: string | null = null;
  editMode = false;

  constructor(
    private service: QuestionCompetenceService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      intitule: [''],
      details: [''],
      status: ['active']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(res => this.questions = res);
  }

  openModal() {
    this.showModal = true;
    this.form.reset({ status: 'active' });
    this.editMode = false;
  }

  submit() {

    if (this.editMode && this.selectedId) {
      this.service.update(this.selectedId, this.form.value)
        .subscribe(() => this.load());
    } else {
      this.service.create(this.form.value)
        .subscribe(() => this.load());
    }

    this.showModal = false;
  }

  edit(q: QuestionCompetence) {
    this.selectedId = q._id!;
    this.editMode = true;
    this.showModal = true;
    this.form.patchValue(q);
  }

  delete(id?: string) {
    if (!id) return;
    this.service.delete(id).subscribe(() => this.load());
  }

}
