import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = 'https://chowder-snooze-mutt.ngrok-free.dev/api/stats';

  constructor(private http: HttpClient) {}

  getSkillStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/skills`);
  }

  getActivityStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/activities`);
  }
}