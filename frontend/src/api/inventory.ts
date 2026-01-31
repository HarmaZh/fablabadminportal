import { apiClient } from './client';
import {
  InventoryItem,
  InventoryItemForm,
  StockAdjustmentForm,
  InventoryStats,
} from '../types';

interface InventoryResponse {
  success: boolean;
  data: {
    items: InventoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface InventoryItemResponse {
  success: boolean;
  data: InventoryItem;
}

interface InventoryStatsResponse {
  success: boolean;
  data: InventoryStats;
}

export interface InventoryFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const inventoryApi = {
  getAll: async (filters?: InventoryFilters): Promise<InventoryResponse['data']> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<InventoryResponse>(
      `/inventory?${params.toString()}`
    );
    return response.data.data;
  },

  getById: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get<InventoryItemResponse>(`/inventory/${id}`);
    return response.data.data;
  },

  create: async (data: InventoryItemForm): Promise<InventoryItem> => {
    const response = await apiClient.post<InventoryItemResponse>('/inventory', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<InventoryItemForm>): Promise<InventoryItem> => {
    const response = await apiClient.put<InventoryItemResponse>(`/inventory/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/${id}`);
  },

  adjustStock: async (id: string, data: StockAdjustmentForm): Promise<InventoryItem> => {
    const response = await apiClient.patch<InventoryItemResponse>(
      `/inventory/${id}/stock`,
      data
    );
    return response.data.data;
  },

  getLowStockAlerts: async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryItem[] }>(
      '/inventory/alerts'
    );
    return response.data.data;
  },

  getStats: async (): Promise<InventoryStats> => {
    const response = await apiClient.get<InventoryStatsResponse>('/inventory/stats');
    return response.data.data;
  },
};
