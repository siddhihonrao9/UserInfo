export interface User {
  userId?: number;
  userName: string;
  userPhoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
}
