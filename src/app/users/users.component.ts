import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { Toast } from './toast/toast.model';
import { UserAddressService } from './user-address.service';
import { User } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {

  users: User[] = [];
  editingUserId?: number;

  userForm!: FormGroup;
  passwordForm!: FormGroup;

  showPasswordModal = false;
  selectedUserId!: number;

  toasts: Toast[] = [];
  toastId = 0;
  isLoading = false;
  submitted = false;


  passwordStrengthValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const pattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return pattern.test(value) ? null : { weakPassword: true };
  };

  phoneNumberValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const pattern = /^[6-9]\d{9}$/;
    return pattern.test(value) ? null : { invalidPhone: true };
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private userAddressService: UserAddressService
  ) { }

  ngOnInit(): void {
    this.initUserForm();
    this.initPasswordForm();
    this.addAddress();
    this.loadUsers();
  }

  initUserForm(): void {
    this.userForm = this.fb.group({
      userName: ['', Validators.required],
      userPhoneNumber: ['', [Validators.required, this.phoneNumberValidator]],
      userPassword: ['', [Validators.required, this.passwordStrengthValidator]],
      status: ['ACTIVE', Validators.required],
      addresses: this.fb.array([])
    });
  }

  initPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, this.passwordStrengthValidator]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  get addresses(): FormArray {
    return this.userForm.get('addresses') as FormArray;
  }

  createAddress(address?: { addressId?: number; fullAddress: string }): FormGroup {
    return this.fb.group({
      addressId: [address?.addressId ?? null],
      fullAddress: [address?.fullAddress ?? '', Validators.required]
    });
  }

  addAddress(): void {
    this.addresses.push(this.createAddress());
  }

  removeAddress(index: number): void {
    this.addresses.removeAt(index);
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: data => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Failed to load users', 'error');
        this.isLoading = false;
      }
    });
  }

  saveUser(): void {
    this.submitted = true;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.showToast('Please fix form errors', 'info');
      return;
    }

    this.isLoading = true;
    const { userPassword, addresses, ...userPayload } = this.userForm.value;

    if (this.editingUserId) {
      this.userService.updateUser(this.editingUserId, userPayload).subscribe({
        next: () => this.saveAddresses(this.editingUserId!, true),
        error: () => {
          this.showToast('Failed to update user', 'error');
          this.isLoading = false;
        }
      });
    } else {
      const createPayload = { ...userPayload, userPassword };
      this.userService.createUser(createPayload).subscribe({
        next: createdUser => {
          if (!createdUser.userId) {
            this.showToast('User created but ID missing', 'error');
            this.isLoading = false;
            return;
          }
          this.saveAddresses(createdUser.userId, false);
        },
        error: () => {
          this.showToast('Failed to create user', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  saveAddresses(userId: number, isUpdate: boolean): void {
    this.userAddressService.saveAddresses(userId, this.addresses.value).subscribe({
      next: () => {
        this.showToast(
          isUpdate ? 'User updated successfully' : 'User created successfully',
          'success'
        );
        this.resetForm();
        this.loadUsers();
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Failed to save addresses', 'error');
        this.isLoading = false;
      }
    });
  }

  editUser(u: User): void {
    this.editingUserId = u.userId;
    if (this.userForm.get('userPassword')) {
      this.userForm.removeControl('userPassword');
    }
    this.userForm.patchValue({
      userName: u.userName,
      userPhoneNumber: u.userPhoneNumber,
      status: u.status
    });
    this.addresses.clear();
    this.userAddressService.getAddressesByUser(u.userId!).subscribe({
      next: addresses => {
        addresses.forEach((a: any) =>
          this.addresses.push(this.createAddress(a))
        );
      },
      error: () => {
        this.showToast('Failed to load addresses', 'error');
      }
    });
  }

  deleteUser(id: number): void {
    this.isLoading = true;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.showToast('User deleted successfully', 'success');
        this.loadUsers();
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Failed to delete user', 'error');
        this.isLoading = false;
      }
    });
  }

  openPasswordModal(user: User): void {
    this.selectedUserId = user.userId!;
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const payload = {
      oldPassword: this.passwordForm.value.oldPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.userService.changePassword(this.selectedUserId, payload).subscribe({
      next: () => {
        this.showToast('Password updated successfully', 'success');
        this.closePasswordModal();
      },
      error: () => {
        this.showToast('Old password is incorrect', 'error');
      }
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.editingUserId = undefined;

    if (!this.userForm.get('userPassword')) {
      this.userForm.addControl(
        'userPassword',
        this.fb.control('', [
          Validators.required,
          this.passwordStrengthValidator
        ])
      );
    }

    this.addresses.clear();
    this.addAddress();

    this.userForm.reset({
      userName: '',
      userPhoneNumber: '',
      userPassword: '',
      status: 'ACTIVE'
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 3000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
