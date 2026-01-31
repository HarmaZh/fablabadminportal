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
      <h1 className="text-4xl font-bold mb-8 text-jet-black">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-white to-pale-sky/20 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-primary-600 mb-2 uppercase tracking-wide">Total Items</h3>
          <p className="text-4xl font-bold text-jet-black">
            {statsLoading ? '...' : stats?.total || 0}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-white to-green-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">In Stock</h3>
          <p className="text-4xl font-bold text-green-600">
            {statsLoading ? '...' : stats?.inStock || 0}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-white to-yellow-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-yellow-700 mb-2 uppercase tracking-wide">Low Stock</h3>
          <p className="text-4xl font-bold text-yellow-600">
            {statsLoading ? '...' : stats?.lowStock || 0}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-white to-red-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wide">Out of Stock</h3>
          <p className="text-4xl font-bold text-red-600">
            {statsLoading ? '...' : stats?.outOfStock || 0}
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="card bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-jet-black">
            <span className="mr-2">⚠️</span>
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white border-2 border-yellow-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-jet-black text-lg">{item.name}</p>
                  <p className="text-sm text-primary-600 font-medium">
                    Current: <span className="font-bold">{item.quantity}</span> | Min: <span className="font-bold">{item.minStock}</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-bold rounded-full shadow-sm ${
                    item.status === 'OUT_OF_STOCK'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-400 text-jet-black'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/inventory"
            className="mt-6 inline-block text-primary-600 hover:text-primary-700 font-semibold hover:underline"
          >
            View all inventory →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6 text-jet-black">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/inventory" className="card bg-gradient-to-br from-pale-sky to-light-blue hover:shadow-xl transition-all transform hover:-translate-y-1">
            <h3 className="font-bold text-xl mb-3 text-jet-black">📦 Manage Inventory</h3>
            <p className="text-primary-700 font-medium">
              View, add, edit, and delete inventory items
            </p>
          </Link>

          <Link to="/students" className="card bg-gradient-to-br from-light-blue to-cool-steel hover:shadow-xl transition-all transform hover:-translate-y-1">
            <h3 className="font-bold text-xl mb-3 text-jet-black">👥 Manage Students</h3>
            <p className="text-primary-700 font-medium">
              View and manage student registrations
            </p>
          </Link>

          <div className="card bg-gradient-to-br from-cool-steel/20 to-steel-gray/20 opacity-70">
            <h3 className="font-bold text-xl mb-3 text-jet-black">📚 Classes (Coming Soon)</h3>
            <p className="text-primary-600 font-medium">
              Manage class schedules and enrollments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
