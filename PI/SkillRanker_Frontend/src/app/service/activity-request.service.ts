import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityRequest {
  _id?: string;
  activity: any;
  manager: any;
  status: 'pending' | 'approved' | 'rejected';
  requestedEmployees: any[];
  notes?: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityRequestService {
  private apiUrl = 'https://chowder-snooze-mutt.ngrok-free.dev/api/activity-requests';

  constructor(private http: HttpClient) {}

  createRequest(request: ActivityRequest): Observable<ActivityRequest> {
    return this.http.post<ActivityRequest>(this.apiUrl, request);
  }

  getRequests(): Observable<ActivityRequest[]> {
    return this.http.get<ActivityRequest[]>(this.apiUrl);
  }

  updateRequest(id: string, request: Partial<ActivityRequest>): Observable<ActivityRequest> {
    return this.http.put<ActivityRequest>(`${this.apiUrl}/${id}`, request);
  }

  deleteRequest(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}