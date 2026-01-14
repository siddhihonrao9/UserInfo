import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserAddress } from './user-address.model';

@Injectable({ providedIn: 'root' })
export class UserAddressService {

  private baseUrl =
    'https://prodcomtech-assignment-siddhi-1-0.onrender.com/api/users';

  constructor(private http: HttpClient) { }

  // =========================
  // GET ADDRESSES BY USER
  // =========================
  getAddressesByUser(userId: number): Observable<UserAddress[]> {
    return this.http.get<UserAddress[]>(
      `${this.baseUrl}/${userId}/addresses`
    );
  }

  // =========================
  // SAVE / UPDATE ADDRESSES (BULK)
  // =========================
  saveAddresses(
    userId: number,
    addresses: UserAddress[]
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${userId}/addresses`,
      addresses
    );
  }

  // =========================
  // DELETE SINGLE ADDRESS
  // =========================
  deleteAddress(
    userId: number,
    addressId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${userId}/addresses/${addressId}`
    );
  }
}
