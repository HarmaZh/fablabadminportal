import { apiClient } from './client';
import { AttendanceRecord, AttendanceForm } from '../types';

interface AttendanceResponse {
  success: boolean;
  data: {
    records: AttendanceRecord[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

interface AttendanceRecordResponse {
  success: boolean;
  data: AttendanceRecord;
}

export interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  date?: string;
  status?: string;
}

export const attendanceApi = {
  getAll: async (filters?: AttendanceFilters): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    const response = await apiClient.get<AttendanceResponse>(`/attendance?${params.toString()}`);
    return response.data.data.records;
  },

  create: async (data: AttendanceForm): Promise<AttendanceRecord> => {
    const response = await apiClient.post<AttendanceRecordResponse>('/attendance', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<AttendanceForm>): Promise<AttendanceRecord> => {
    const response = await apiClient.put<AttendanceRecordResponse>(`/attendance/${id}`, data);
    return response.data.data;
  },
};
