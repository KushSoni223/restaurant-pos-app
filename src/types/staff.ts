import type { UserRole } from '@/types/user';
import type { MenuCategory } from '@/types/menu';

export interface StaffMember {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_available: boolean;
  specialties: MenuCategory[];
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  specialty_category_ids: number[];
}
