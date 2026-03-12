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
      {/* Gradient Hero Banner */}
      <div className="mb-8 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-400 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm font-medium uppercase tracking-wide mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-bold">Good {getTimeOfDay()}, {user?.firstName}</h1>
            <p className="text-primary-100 mt-1 text-sm">Here's what's happening with your FabLab today.</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.153-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-primary-100">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">
              {statsLoading ? '—' : stats?.total ?? 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-emerald-100">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">In Stock</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">
              {statsLoading ? '—' : stats?.inStock ?? 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-amber-100">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">
              {statsLoading ? '—' : stats?.lowStock ?? 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Out of Stock</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">
              {statsLoading ? '—' : stats?.outOfStock ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="card border border-amber-200 bg-amber-50 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center text-gray-900">
            <svg className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Low Stock Alerts
          </h2>
          <div className="space-y-2">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Current: <span className="font-semibold text-gray-700">{item.quantity}</span> &nbsp;·&nbsp; Min: <span className="font-semibold text-gray-700">{item.minStock}</span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                    item.status === 'OUT_OF_STOCK'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/inventory"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-semibold text-sm hover:underline"
          >
            View all inventory →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/inventory" className="card border-l-4 border-primary-500 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-primary-100">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-semibold text-base text-gray-900 group-hover:text-primary-700 transition-colors">Manage Inventory</h3>
            </div>
            <p className="text-sm text-gray-500">
              View, add, edit, and delete inventory items
            </p>
          </Link>

          <Link to="/students" className="card border-l-4 border-emerald-500 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-emerald-100">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-base text-gray-900 group-hover:text-emerald-700 transition-colors">Student Management</h3>
            </div>
            <p className="text-sm text-gray-500">
              Manage student registrations and enrollments
            </p>
          </Link>

          <Link to="/classes" className="card border-l-4 border-violet-500 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon bg-violet-100">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-base text-gray-900 group-hover:text-violet-700 transition-colors">Class Management</h3>
            </div>
            <p className="text-sm text-gray-500">
              Manage class schedules and enrollments
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
