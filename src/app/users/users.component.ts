import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
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

  // =========================
  // DATA
  // =========================
  users: User[] = [];
  editingUserId?: number;

  // =========================
  // FORMS
  // =========================
  userForm!: FormGroup;
  passwordForm!: FormGroup;

  showPasswordModal = false;
  selectedUserId!: number;

  // =========================
  // UI STATE
  // =========================
  toasts: Toast[] = [];
  toastId = 0;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private userAddressService: UserAddressService
  ) { }

  ngOnInit(): void {
    this.initUserForm();
    this.initPasswordForm();
    this.addAddress(); // at least one address
    this.loadUsers();
  }

  // =========================
  // FORM INIT
  // =========================
  initUserForm(): void {
    this.userForm = this.fb.group({
      userName: ['', Validators.required],
      userPhoneNumber: ['', Validators.required],
      userPassword: ['', [Validators.required, Validators.minLength(6)]], // CREATE ONLY
      status: ['ACTIVE', Validators.required],
      addresses: this.fb.array([])
    });
  }

  initPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value ===
      form.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  // =========================
  // FORM ARRAY HELPERS
  // =========================
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

  // =========================
  // LOAD USERS
  // =========================
  loadUsers(): void {
    this.isLoading = true;

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Failed to load users', 'error');
        this.isLoading = false;
      }
    });
  }

  // =========================
  // SAVE USER
  // =========================
  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.showToast('Please fix form errors', 'info');
      return;
    }

    this.isLoading = true;

    const { userPassword, addresses, ...userPayload } = this.userForm.value;

    // -------- UPDATE USER --------
    if (this.editingUserId) {
      this.userService.updateUser(this.editingUserId, userPayload).subscribe({
        next: () => this.saveAddresses(this.editingUserId!, true),
        error: () => {
          this.showToast('Failed to update user', 'error');
          this.isLoading = false;
        }
      });
    }

    // -------- CREATE USER --------
    else {
      const createPayload = { ...userPayload, userPassword };

      this.userService.createUser(createPayload).subscribe({
        next: (createdUser) => {
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

  // =========================
  // SAVE ADDRESSES
  // =========================
  saveAddresses(userId: number, isUpdate: boolean): void {
    this.userAddressService
      .saveAddresses(userId, this.addresses.value)
      .subscribe({
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

  // =========================
  // EDIT USER
  // =========================
  editUser(u: User): void {
    this.editingUserId = u.userId;

    // Remove password field
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
      next: (addresses) => {
        addresses.forEach((a: any) =>
          this.addresses.push(this.createAddress(a))
        );
      },
      error: () => {
        this.showToast('Failed to load addresses', 'error');
      }
    });
  }

  // =========================
  // DELETE USER
  // =========================
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

  // =========================
  // PASSWORD
  // =========================
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

  // =========================
  // RESET
  // =========================
  resetForm(): void {
    this.editingUserId = undefined;

    if (!this.userForm.get('userPassword')) {
      this.userForm.addControl(
        'userPassword',
        new FormControl('', [
          Validators.required,
          Validators.minLength(6)
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

  // =========================
  // TOASTS
  // =========================
  showToast(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ): void {
    const id = ++this.toastId;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 3000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
