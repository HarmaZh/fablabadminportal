import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../api/inventory';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: inventoryApi.getStats,
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: inventoryApi.getLowStockAlerts,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Items</h3>
          <p className="text-3xl font-bold text-gray-900">
            {statsLoading ? '...' : stats?.total || 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">In Stock</h3>
          <p className="text-3xl font-bold text-green-600">
            {statsLoading ? '...' : stats?.inStock || 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Low Stock</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {statsLoading ? '...' : stats?.lowStock || 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Out of Stock</h3>
          <p className="text-3xl font-bold text-red-600">
            {statsLoading ? '...' : stats?.outOfStock || 0}
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            Low Stock Alerts
          </h2>
          <div className="space-y-2">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Current: {item.quantity} | Min: {item.minStock}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    item.status === 'OUT_OF_STOCK'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/inventory"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            View all inventory →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/inventory" className="card hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-lg mb-2">📦 Manage Inventory</h3>
            <p className="text-gray-600 text-sm">
              View, add, edit, and delete inventory items
            </p>
          </Link>

          <div className="card bg-gray-100 opacity-60">
            <h3 className="font-semibold text-lg mb-2">👥 Students (Coming Soon)</h3>
            <p className="text-gray-600 text-sm">
              Manage student registrations
            </p>
          </div>

          <div className="card bg-gray-100 opacity-60">
            <h3 className="font-semibold text-lg mb-2">📚 Classes (Coming Soon)</h3>
            <p className="text-gray-600 text-sm">
              Manage class schedules and enrollments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
