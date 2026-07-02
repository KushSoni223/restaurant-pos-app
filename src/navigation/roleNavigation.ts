import { ROLE_HOME_ROUTES } from '@/constants/routes';
import { UserRole } from '@/types/user';

export function getHomeRouteForRole(role: UserRole): string {
  return ROLE_HOME_ROUTES[role];
}
