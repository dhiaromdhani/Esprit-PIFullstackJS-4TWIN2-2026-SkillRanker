// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// export interface QuestionCompetence {
//   _id?: string;
//   intitule: string;
//   details?: string;
//   status: string;
// }

// @Injectable({ providedIn: 'root' })
// export class QuestionCompetenceService {

//   private api = 'https://chowder-snooze-mutt.ngrok-free.dev/api/question-competences';

//   constructor(private http: HttpClient) {}

//   getAll(): Observable<QuestionCompetence[]> {
//     return this.http.get<QuestionCompetence[]>(this.api);
//   }

//   create(data: any): Observable<QuestionCompetence> {
//     return this.http.post<QuestionCompetence>(this.api, data);
//   }

//   update(id: string, data: any): Observable<QuestionCompetence> {
//     return this.http.put<QuestionCompetence>(`${this.api}/${id}`, data);
//   }

//   delete(id: string): Observable<any> {
//     return this.http.delete(`${this.api}/${id}`);
//   }
// }
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuestionCompetence {
  _id?: string;
  intitule: string;
  details: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class QuestionCompetenceService {

  private api = 'https://chowder-snooze-mutt.ngrok-free.dev/api/question-competences';

  constructor(private http: HttpClient) {}

  getAll(): Observable<QuestionCompetence[]> {
    return this.http.get<QuestionCompetence[]>(this.api);
  }

  create(data: any) {
    return this.http.post(this.api, data);
  }

  update(id: string, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }
}