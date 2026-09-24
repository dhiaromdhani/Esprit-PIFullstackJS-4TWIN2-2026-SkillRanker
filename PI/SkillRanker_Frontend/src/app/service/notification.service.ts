import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ActivityRef {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  status?: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  activityId?: string | ActivityRef;
  isRead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'https://chowder-snooze-mutt.ngrok-free.dev/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<{ notifications: Notification[]; unread: number }>(`${this.apiUrl}/my-notifications`)
      .pipe(map(res => res.notifications || []));
  }

  getMyNotifications(): Observable<{ notifications: Notification[]; unread: number }> {
    return this.http.get<{ notifications: Notification[]; unread: number }>(`${this.apiUrl}/my-notifications`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/read/${id}`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/read-all`, {});
  }

  confirmRecommendations(data: {
    activityId: string;
    prompt?: string;
    employees?: Array<{
      csvEmployeeId?: number | null;
      employeeId?: string | null;
      userId?: string | null;
      email?: string;
      name: string;
      score: number;
      jobTitle?: string;
    }>;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm-recommendations`, data);
  }

  respondToActivity(activityId: string, accepted: boolean, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/respond`, { activityId, accepted, reason });
  }

  completeActivity(activityId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/complete`, { activityId });
  }

  getMyActivities(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-activities`);
  }

  getCertificationApprovals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/certification-approvals`);
  }

  approveCertification(data: {
    activityId: string;
    userId?: string;
    employeeId?: string;
    certificateUrl?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-certification`, data);
  }

  getManagerApprovals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/approvals`);
  }

  handleApproval(approvalId: string, approved: boolean, comment: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/approvals/${approvalId}`, { approved, comment });
  }
}