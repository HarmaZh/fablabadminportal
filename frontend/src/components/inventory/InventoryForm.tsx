import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InventoryItemForm, InventoryItem } from '../../types';

const inventoryFormSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CHOCOLATE', 'SOAP', 'PINS', 'DRONES', 'TOOLS', 'MATERIALS', 'OTHER']),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  minStock: z.number().int().min(0, 'Minimum stock cannot be negative'),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']),
  notes: z.string().optional(),
});

interface InventoryFormProps {
  item?: InventoryItem;
  onSubmit: (data: InventoryItemForm) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const InventoryFormComponent: React.FC<InventoryFormProps> = ({
  item,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InventoryItemForm>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: item || {
      quantity: 0,
      minStock: 0,
      status: 'IN_STOCK',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item ID *
          </label>
          <input
            {...register('itemId')}
            className="input"
            placeholder="CHOC-001"
            disabled={!!item}
          />
          {errors.itemId && (
            <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            {...register('name')}
            className="input"
            placeholder="Chocolate Melter"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select {...register('type')} className="input">
            <option value="CHOCOLATE">Chocolate</option>
            <option value="SOAP">Soap</option>
            <option value="PINS">Pins</option>
            <option value="DRONES">Drones</option>
            <option value="TOOLS">Tools</option>
            <option value="MATERIALS">Materials</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price *
          </label>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="input"
            placeholder="5.00"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            {...register('quantity', { valueAsNumber: true })}
            type="number"
            className="input"
            placeholder="10"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Stock *
          </label>
          <input
            {...register('minStock', { valueAsNumber: true })}
            type="number"
            className="input"
            placeholder="5"
          />
          {errors.minStock && (
            <p className="mt-1 text-sm text-red-600">{errors.minStock.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status *
        </label>
        <select {...register('status')} className="input">
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="DISCONTINUED">Discontinued</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="input"
          placeholder="Additional notes..."
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
