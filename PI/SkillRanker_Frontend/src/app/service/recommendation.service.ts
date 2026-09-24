import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/recommend';

  constructor(private http: HttpClient) {}

  getRecommendations(activityId: string, prompt: string): Observable<any> {
    return this.http.post<any>(`${this.API}/${activityId}`, { prompt });
  }
}