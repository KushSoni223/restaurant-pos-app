import { UserRole } from '@/types/user';

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  CUSTOMER: '/(customer)/menu',
  WAITER: '/(waiter)/tables',
  CHEF: '/(chef)/kitchen',
  ADMIN: '/(admin)/dashboard',
};
