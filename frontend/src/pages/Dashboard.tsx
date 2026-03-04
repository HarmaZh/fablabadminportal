import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../api/inventory';
import { useAuth } from '../context/AuthContext';

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

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
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-jet-black">
          Good {getTimeOfDay()}, {user?.firstName}
        </h1>
        <p className="text-primary-600 mt-1 font-medium">
          Here's what's happening with your FabLab today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-primary-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-1">Total Items</p>
            <p className="text-3xl font-bold text-jet-black leading-none">
              {statsLoading ? '—' : stats?.total ?? 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">In Stock</p>
            <p className="text-3xl font-bold text-jet-black leading-none">
              {statsLoading ? '—' : stats?.inStock ?? 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-yellow-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-jet-black leading-none">
              {statsLoading ? '—' : stats?.lowStock ?? 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Out of Stock</p>
            <p className="text-3xl font-bold text-jet-black leading-none">
              {statsLoading ? '—' : stats?.outOfStock ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="card bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-jet-black">
            <svg className="w-6 h-6 mr-2 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white border-2 border-yellow-300 rounded-xl shadow-sm hover:shadow-md transition-shadow"
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
        <h2 className="text-xl font-bold mb-5 text-jet-black">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link to="/inventory" className="card bg-gradient-to-br from-white to-pale-sky/30 hover:shadow-md transition-all transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-jet-black">Manage Inventory</h3>
            </div>
            <p className="text-sm text-primary-700 font-medium">
              View, add, edit, and delete inventory items
            </p>
          </Link>

          <Link to="/students" className="card bg-gradient-to-br from-white to-cool-steel/20 hover:shadow-md transition-all transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-jet-black">Student Management</h3>
            </div>
            <p className="text-sm text-primary-700 font-medium">
              Manage student registrations and enrollments
            </p>
          </Link>

          <Link to="/classes" className="card bg-gradient-to-br from-white to-light-blue/25 hover:shadow-md transition-all transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-jet-black">Class Management</h3>
            </div>
            <p className="text-sm text-primary-700 font-medium">
              Manage class schedules and enrollments
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
