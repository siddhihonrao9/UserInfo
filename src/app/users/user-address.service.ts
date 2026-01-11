import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserAddress } from './user-address.model';

@Injectable({ providedIn: 'root' })
export class UserAddressService {

  private baseUrl = 'https://userinfo-app-1mrn.onrender.com/api/addresses';

  constructor(private http: HttpClient) { }

  addAddress(userId: number, address: UserAddress): Observable<UserAddress> {
    return this.http.post<UserAddress>(`${this.baseUrl}/${userId}`, address);
  }

  getAddressesByUser(userId: number): Observable<UserAddress[]> {
    return this.http.get<UserAddress[]>(`${this.baseUrl}/user/${userId}`);
  }

  deleteAddress(addressId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${addressId}`);
  }
}
