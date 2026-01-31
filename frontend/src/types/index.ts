// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STAFF' | 'INSTRUCTOR';
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// Inventory types
export type InventoryType = 'CHOCOLATE' | 'SOAP' | 'PINS' | 'DRONES' | 'TOOLS' | 'MATERIALS' | 'OTHER';
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: InventoryType;
  price: number;
  quantity: number;
  minStock: number;
  status: InventoryStatus;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  userId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STOCK_ADDED' | 'STOCK_REMOVED';
  oldValue?: any;
  newValue?: any;
  quantity?: number;
  notes?: string;
  createdAt: string;
}

export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalItems: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface InventoryItemForm {
  itemId: string;
  name: string;
  type: InventoryType;
  price: number;
  quantity: number;
  minStock: number;
  status: InventoryStatus;
  notes?: string;
}

export interface StockAdjustmentForm {
  quantity: number;
  notes?: string;
}
