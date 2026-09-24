import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  users: {
    total: number;
    byRole: {
      employees: number;
      managers: number;
      hrManagers: number;
      admins: number;
    };
  };
  activities: {
    total: number;
    byStatus: {
      draft: number;
      open: number;
      inProgress: number;
      completed: number;
      cancelled: number;
    };
    byType: {
      training: number;
      certification: number;
      project: number;
      mission: number;
      audit: number;
    };
    byCategory: {
      technical: number;
      management: number;
      transversal: number;
    };
    totalSeats: number;
    recent: any[];
    monthly: any[];
  };
}

export interface EmployeeResponseRow {
  activityId: string;
  activityTitle: string;
  activityType: string;
  activityCategory: string;
  employeeName: string;
  employeeEmail: string;
  responseStatus: string;
  justification: string;
  selectedAt?: string | null;
  respondedAt?: string | null;
}

export interface ManagerEvaluationRow {
  activityId: string;
  activityTitle: string;
  activityType: string;
  activityCategory: string;

  employeeId?: string | null;
  userId?: string | null;

  employeeName: string;
  employeeEmail: string;

  status: string;

  managerScore?: number | null;
  managerComment?: string;
  managerEvaluatedAt?: string | null;
}

export interface ManagerEvaluationPayload {
  activityId: string;
  employeeId?: string | null;
  userId?: string | null;
  employeeEmail?: string | null;
  score: number;
  comment?: string;
}

export interface EmployeeReceivedEvaluationRow {
  activityId: string;
  activityTitle: string;
  activityType: string;
  activityCategory: string;
  status: string;
  managerScore?: number | null;
  managerComment?: string;
  managerEvaluatedAt?: string | null;
  completedAt?: string | null;
  certificateUrl?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API}/stats`);
  }

  getEmployeeResponses(): Observable<EmployeeResponseRow[]> {
    return this.http.get<EmployeeResponseRow[]>(`${this.API}/responses`);
  }

  getManagerEvaluationTargets(): Observable<ManagerEvaluationRow[]> {
    return this.http.get<ManagerEvaluationRow[]>(`${this.API}/manager-evaluations`);
  }

  evaluateEmployee(payload: ManagerEvaluationPayload): Observable<any> {
    return this.http.post(`${this.API}/manager-evaluations`, payload);
  }

  getEmployeeReceivedEvaluations(): Observable<EmployeeReceivedEvaluationRow[]> {
    return this.http.get<EmployeeReceivedEvaluationRow[]>(`${this.API}/employee-evaluations`);
  }
}