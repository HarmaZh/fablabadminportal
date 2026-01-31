import { z } from 'zod';

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'STAFF', 'INSTRUCTOR']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// =============================================================================
// INVENTORY SCHEMAS
// =============================================================================

export const createInventoryItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CHOCOLATE', 'SOAP', 'PINS', 'DRONES', 'TOOLS', 'MATERIALS', 'OTHER']),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  minStock: z.number().int().min(0, 'Minimum stock cannot be negative').default(0),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial().omit({ itemId: true });

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int(),
  notes: z.string().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

// =============================================================================
// QUERY PARAMS
// =============================================================================

export const inventoryQuerySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
