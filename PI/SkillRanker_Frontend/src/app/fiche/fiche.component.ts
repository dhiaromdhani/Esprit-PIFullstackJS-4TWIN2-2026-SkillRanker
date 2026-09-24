import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FicheService, Fiche } from '../service/fiche.service';
import { VocalService } from '../service/vocal.service';

@Component({
  selector: 'app-fiche',
  templateUrl: './fiche.component.html',
  styleUrls: ['./fiche.component.css']
})
export class FicheComponent implements OnInit {

  fiches: Fiche[] = [];

  showModal = false;
  editMode = false;
  selectedId: string | null = null;

  ficheForm: FormGroup;

  constructor(
    private ficheService: FicheService,
    private fb: FormBuilder,
    public vocalService: VocalService
  ) {
    this.ficheForm = this.fb.group({
      saisons: [''],
      etat: ['draft']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.ficheService.getAll().subscribe(res => {
      this.fiches = res;
    });
  }

  openModal(): void {
    this.showModal = true;
    this.editMode = false;
    this.selectedId = null;
    this.ficheForm.reset({ etat: 'draft' });
  }

  closeModal(): void {
    this.showModal = false;
  }

  submit(): void {

    const data = {
      ...this.ficheForm.value,
      user: localStorage.getItem('userId') // IMPORTANT FIX
    };

    if (this.editMode && this.selectedId) {
      this.ficheService.update(this.selectedId, data)
        .subscribe(() => this.load());
    } else {
      this.ficheService.create(data)
        .subscribe(() => this.load());
    }

    this.closeModal();
  }

  delete(id?: string): void {
    if (!id) return;

    this.ficheService.delete(id).subscribe(() => {
      this.fiches = this.fiches.filter(f => f._id !== id);
    });
  }

  edit(f: Fiche): void {
    this.selectedId = f._id || null;
    this.editMode = true;
    this.showModal = true;

    this.ficheForm.patchValue({
      saisons: f.saisons,
      etat: f.etat
    });
  }
}