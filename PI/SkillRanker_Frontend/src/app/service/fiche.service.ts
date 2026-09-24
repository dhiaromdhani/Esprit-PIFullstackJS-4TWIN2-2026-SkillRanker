import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Fiche {
  _id?: string;
  user: any;
  saisons: string;
  etat: string;
}

@Injectable({ providedIn: 'root' })
export class FicheService {

  private api = 'https://chowder-snooze-mutt.ngrok-free.dev/api/fiches';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Fiche[]> {
    return this.http.get<Fiche[]>(this.api);
  }

  create(data: any): Observable<Fiche> {
    return this.http.post<Fiche>(this.api, data);
  }

  update(id: string, data: any): Observable<Fiche> {
    return this.http.put<Fiche>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}