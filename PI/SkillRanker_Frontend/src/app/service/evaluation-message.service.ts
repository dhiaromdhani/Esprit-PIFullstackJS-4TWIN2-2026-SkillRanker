import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EvaluationMessage {
  _id?: string;

  employeeId?: string;
  employeeEmail?: string;
  employeeName?: string;

  managerId?: string;
  managerName?: string;

  activityTitle?: string;
  note?: number;
  comment?: string;

  title?: string;
  message: string;
  type?: string;
  read?: boolean;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationMessageService {
  private apiUrl = 'https://chowder-snooze-mutt.ngrok-free.dev/api/evaluation-messages';

  constructor(private http: HttpClient) {}

  createMessage(payload: EvaluationMessage): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  getEmployeeMessages(identifier: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee/${encodeURIComponent(identifier)}`);
  }

  markAsRead(messageId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${messageId}/read`, {});
  }
}