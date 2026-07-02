export type UserRole = 'CUSTOMER' | 'WAITER' | 'CHEF' | 'ADMIN';

export interface User {
  id: number;
  role: UserRole;
  name?: string;
  email?: string;
}
