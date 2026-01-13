import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './user.model';

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'https://prodcomtech-assignment-siddhi-1-0.onrender.com/api/users';

  constructor(private http: HttpClient) { }

  // =========================
  // USERS
  // =========================

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // =========================
  // CHANGE PASSWORD
  // =========================

  changePassword(
    userId: number,
    payload: ChangePasswordRequest
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${userId}/change-password`,
      payload
    );
  }
}
