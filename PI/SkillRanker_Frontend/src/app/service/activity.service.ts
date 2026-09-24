import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// export interface Activity {
//   _id?: string;
//   title: string;
//   description?: string;
//   date?: string;
//   status?: string;
//   createdBy?: any;
//   department?: any;
//   recommendedEmployees?: any[];
//   selectedEmployees?: any[];
//   assignedManager?: any;
//   finalConfirmationBy?: any;
//   finalConfirmationDate?: Date;
//   notes?: string;
// }
export interface RequiredSkill {
  name: string;
  type: string;
  desiredLevel: string;
  weight?: number;
}

export interface SelectedEmployee {
  employeeId: string;
  score?: number;
  selectedAt?: string;
  status?: string;
}

export interface Activity {
  _id?: string;
  title: string;
  description?: string;
  type?: string;
  category?: string;
  status?: string;
  seats?: number;
  priorityContext?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  date?: string;
  requiredSkills?: RequiredSkill[];
  selectedEmployees?: SelectedEmployee[];
  createdBy?: any;
  department?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = 'https://chowder-snooze-mutt.ngrok-free.dev/api/activities'; // ton backend

  constructor(private http: HttpClient) {}

  // GET all activities
  getActivities(filters?: any): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.apiUrl);
  }

  // GET activity by ID
  getActivityById(id: string): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/${id}`);
  }

  // CREATE new activity
  createActivity(activity: Activity): Observable<Activity> {
    return this.http.post<Activity>(this.apiUrl, activity);
  }

  // UPDATE activity
  updateActivity(id: string, activity: Activity): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/${id}`, activity);
  }

  // DELETE activity
  deleteActivity(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // AI-based employee recommendation
  recommendEmployees(activityId: string): Observable<Activity> {
    return this.http.post<Activity>(`${this.apiUrl}/${activityId}/recommend`, {});
  }

  // Update recommendations (HR review)
  updateRecommendations(activityId: string, recommendations: any[]): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/${activityId}/recommendations`, { recommendedEmployees: recommendations });
  }

  // Forward to manager
  forwardToManager(activityId: string, managerId: string): Observable<Activity> {
    return this.http.post<Activity>(`${this.apiUrl}/${activityId}/forward`, { managerId });
  }

  // Manager confirms participants
  confirmParticipants(activityId: string, selectedEmployees: string[]): Observable<Activity> {
    return this.http.post<Activity>(`${this.apiUrl}/${activityId}/confirm`, { selectedEmployees });
  }

  // Employee responds to invitation
  respondToInvitation(activityId: string, status: string, justification?: string): Observable<Activity> {
    return this.http.post<Activity>(`${this.apiUrl}/${activityId}/respond`, { status, justification });
  }

  // Get activities for current user
  getMyActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/my/activities`);
  }

  // getActivities(filters?: any): Observable<Activity[]> { ... }

updateStatus(id: string, status: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
}
}