import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecommendationHistory {
  _id?: string;
  activity: any;
  recommendedEmployees: any[];
  selectedEmployees: any[];
  decisionBy?: any;
  decisionDate: Date;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private apiUrl = 'https://chowder-snooze-mutt.ngrok-free.dev/api/history';

  constructor(private http: HttpClient) {}

  getHistory(): Observable<RecommendationHistory[]> {
    return this.http.get<RecommendationHistory[]>(this.apiUrl);
  }
}