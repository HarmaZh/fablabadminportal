import { apiClient } from './client';
import { Class, ClassForm } from '../types';

interface ClassesResponse {
  success: boolean;
  data: Class[];
}

interface ClassResponse {
  success: boolean;
  data: Class;
}

export interface ClassFilters {
  search?: string;
  status?: string;
  ageGroup?: string;
  instructorId?: string;
  page?: number;
  limit?: number;
}

export interface ClassesData {
  classes: Class[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const classesApi = {
  getAll: async (filters?: ClassFilters): Promise<ClassesData> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ageGroup) params.append('ageGroup', filters.ageGroup);
    if (filters?.instructorId) params.append('instructorId', filters.instructorId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get<ClassesResponse>(`/classes?${params.toString()}`);
    const classes = response.data.data;
    return { classes, total: classes.length, page: 1, limit: classes.length, pages: 1 };
  },

  getById: async (id: string): Promise<Class> => {
    const response = await apiClient.get<ClassResponse>(`/classes/${id}`);
    return response.data.data;
  },

  create: async (data: ClassForm): Promise<Class> => {
    const response = await apiClient.post<ClassResponse>('/classes', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<ClassForm>): Promise<Class> => {
    const response = await apiClient.put<ClassResponse>(`/classes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/classes/${id}`);
  },
};
