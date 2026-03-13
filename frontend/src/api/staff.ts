import { apiClient } from './client';
import { StaffMember, StaffForm } from '../types';

interface StaffResponse {
  success: boolean;
  data: StaffMember[];
}

interface StaffMemberResponse {
  success: boolean;
  data: StaffMember;
}

export interface StaffFilters {
  search?: string;
  role?: string;
  active?: boolean;
}

export const staffApi = {
  getAll: async (filters?: StaffFilters): Promise<StaffMember[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    const response = await apiClient.get<StaffResponse>(`/staff?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<StaffMember> => {
    const response = await apiClient.get<StaffMemberResponse>(`/staff/${id}`);
    return response.data.data;
  },

  create: async (data: StaffForm): Promise<StaffMember> => {
    const response = await apiClient.post<StaffMemberResponse>('/staff', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<StaffForm>): Promise<StaffMember> => {
    const response = await apiClient.put<StaffMemberResponse>(`/staff/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },
};
