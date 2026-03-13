import { apiClient } from './client';
import { Student, StudentForm } from '../types';

interface StudentsResponse {
  success: boolean;
  data: {
    students: Student[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

interface StudentResponse {
  success: boolean;
  data: Student;
}

export interface StudentFilters {
  search?: string;
  status?: string;
  ageGroup?: string;
  page?: number;
  limit?: number;
}

export interface StudentsData {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const studentsApi = {
  getAll: async (filters?: StudentFilters): Promise<StudentsData> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ageGroup) params.append('ageGroup', filters.ageGroup);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get<StudentsResponse>(`/students?${params.toString()}`);
    const { students, pagination } = response.data.data;
    return { students, total: pagination.total, page: pagination.page, limit: pagination.limit, pages: pagination.pages };
  },

  getById: async (id: string): Promise<Student> => {
    const response = await apiClient.get<StudentResponse>(`/students/${id}`);
    return response.data.data;
  },

  create: async (data: StudentForm): Promise<Student> => {
    const response = await apiClient.post<StudentResponse>('/students', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<StudentForm>): Promise<Student> => {
    const response = await apiClient.put<StudentResponse>(`/students/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};
