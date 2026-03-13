import { apiClient } from './client';
import { Equipment, EquipmentForm } from '../types';

interface EquipmentListResponse {
  success: boolean;
  data: Equipment[];
}

interface EquipmentResponse {
  success: boolean;
  data: Equipment;
}

export interface EquipmentFilters {
  search?: string;
  category?: string;
  status?: string;
}

export const equipmentApi = {
  getAll: async (filters?: EquipmentFilters): Promise<Equipment[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    const response = await apiClient.get<EquipmentListResponse>(`/equipment?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Equipment> => {
    const response = await apiClient.get<EquipmentResponse>(`/equipment/${id}`);
    return response.data.data;
  },

  create: async (data: EquipmentForm): Promise<Equipment> => {
    const response = await apiClient.post<EquipmentResponse>('/equipment', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<EquipmentForm>): Promise<Equipment> => {
    const response = await apiClient.put<EquipmentResponse>(`/equipment/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: string): Promise<Equipment> => {
    const response = await apiClient.patch<EquipmentResponse>(`/equipment/${id}/status`, { status });
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/equipment/${id}`);
  },
};
