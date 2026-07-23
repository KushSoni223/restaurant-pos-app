import { apiRequest } from './client';
import type { CreateStaffPayload, StaffMember } from '@/types/staff';

export async function listStaff(): Promise<StaffMember[]> {
  return apiRequest<StaffMember[]>('/api/v1/staff');
}

export async function createStaff(payload: CreateStaffPayload): Promise<StaffMember> {
  return apiRequest<StaffMember>('/api/v1/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStaffAvailability(
  userId: number,
  isAvailable: boolean,
): Promise<StaffMember> {
  return apiRequest<StaffMember>(`/api/v1/staff/${userId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ is_available: isAvailable }),
  });
}
