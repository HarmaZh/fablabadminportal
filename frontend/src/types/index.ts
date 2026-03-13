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

// Student types
export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  parentName?: string;
  ageGroup?: string;
  status: 'active' | 'inactive' | 'incomplete';
  createdAt: string;
  updatedAt: string;
  enrollments?: Enrollment[];
  _count?: { enrollments: number };
}

export interface StudentForm {
  name: string;
  email: string;
  phone?: string;
  parentName?: string;
  ageGroup?: string;
  status?: string;
}

// Staff types
export interface StaffMember {
  id: string;
  staffId?: string;
  name: string;
  email: string;
  role: 'INSTRUCTOR' | 'ADMIN' | 'COORDINATOR' | 'VOLUNTEER';
  specialization?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { classes: number };
}

export interface StaffForm {
  name: string;
  email: string;
  role: string;
  specialization?: string;
  phone?: string;
  active?: boolean;
}

// Class types
export interface Class {
  id: string;
  name: string;
  description?: string;
  ageGroup?: string;
  scheduleDescription?: string;
  isRecurring: boolean;
  instructorId?: string;
  instructor?: StaffMember;
  color?: string;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
  updatedAt: string;
  enrollments?: Enrollment[];
  _count?: { enrollments: number };
}

export interface ClassForm {
  name: string;
  description?: string;
  ageGroup?: string;
  scheduleDescription?: string;
  isRecurring?: boolean;
  instructorId?: string;
  color?: string;
  status?: string;
}

// Equipment types
export interface Equipment {
  id: string;
  equipmentId: string;
  name: string;
  category: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  lastMaintenance?: string;
  nextMaintenance?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentForm {
  equipmentId: string;
  name: string;
  category: string;
  status?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  notes?: string;
}

// Enrollment types
export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  registrationDate: string;
  status: 'confirmed' | 'incomplete' | 'cancelled';
  notes?: string;
  student?: Student;
  class?: Class;
}

// Attendance types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'late' | 'absent';
  notes?: string;
  student?: Student;
  class?: Class;
}

export interface AttendanceForm {
  studentId: string;
  classId: string;
  date: string;
  status: string;
  notes?: string;
}
