import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserAddress } from './user-address.model';
import { UserAddressService } from './user-address.service';

@Component({
  selector: 'app-user-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-address.component.html'
})
export class UserAddressComponent implements OnInit {

  @Input() userId!: number;

  addressForm!: FormGroup;
  addresses: UserAddress[] = [];

  constructor(
    private fb: FormBuilder,
    private addressService: UserAddressService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAddresses();
  }

  initForm() {
    this.addressForm = this.fb.group({
      fullAddress: ['', Validators.required]
    });
  }

  loadAddresses() {
    this.addressService.getAddressesByUser(this.userId)
      .subscribe(data => this.addresses = data);
  }

  saveAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.addressService.addAddress(this.userId, this.addressForm.value)
      .subscribe(() => {
        this.addressForm.reset();
        this.loadAddresses();
      });
  }

  deleteAddress(addressId: number) {
    this.addressService.deleteAddress(addressId)
      .subscribe(() => this.loadAddresses());
  }
}
