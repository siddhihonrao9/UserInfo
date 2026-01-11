export interface User {
  userId?: number;
  userName: string;
  userPhoneNumber: string;
  userPassword: string;
  status: 'ACTIVE' | 'INACTIVE';
}
