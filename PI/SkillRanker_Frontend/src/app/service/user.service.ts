import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {

  private API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/users';
  private api = 'https://chowder-snooze-mutt.ngrok-free.dev/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API}/${id}`);
  }

  createUser(data: any): Observable<User> {
    return this.http.post<User>(this.API, data);
  }

  updateUser(id: string, data: any): Observable<User> {
    return this.http.put<User>(`${this.API}/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.API}/change-password`, data);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.api}/auth/me`, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    });
  }

  getManagers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API}/managers`);
  }
}