import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Competence {
  _id?: string;
  fiches_id: string;
  question_competence_id: string;
  type: string;
  intitule: string;
  auto_eval: number;
  hierarchie_eval: number;
  etat: string;
}

@Injectable({ providedIn: 'root' })
export class CompetenceService {

  private api = 'https://chowder-snooze-mutt.ngrok-free.dev/api/competences';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Competence[]> {
    return this.http.get<Competence[]>(this.api);
  }

  create(data: any): Observable<Competence> {
    return this.http.post<Competence>(this.api, data);
  }

  update(id: string, data: any): Observable<Competence> {
    return this.http.put<Competence>(`${this.api}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }
}