import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../components/common/Modal';
import { equipmentApi } from '../api/equipment';
import { Equipment as EquipmentType } from '../types';

const TYPE_LABELS: Record<string, string> = {
  THREE_D_PRINTER: '3D Printer',
  LASER_CUTTER: 'Laser Cutter',
  PIN_PRESS: 'Pin Press',
  DRONE: 'Drone',
  ROBOTICS: 'Robotics',
  OTHER: 'Other',
};

const getDaysUntil = (dateStr?: string) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const today = new Date();
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const isDueSoon = (dateStr?: string) => {
  const days = getDaysUntil(dateStr);
  return days !== null && days <= 30;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    OPERATIONAL: 'bg-emerald-100 text-emerald-700',
    MAINTENANCE: 'bg-amber-100 text-amber-700',
    OUT_OF_SERVICE: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
};

const STATUS_LABEL: Record<string, string> = {
  OPERATIONAL: 'Operational',
  MAINTENANCE: 'In Repair',
  OUT_OF_SERVICE: 'Out of Service',
};

export const Equipment: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<EquipmentType | null>(null);

  const [formData, setFormData] = useState({
    equipmentId: '',
    name: '',
    category: 'OTHER',
    status: 'OPERATIONAL',
    lastMaintenance: '',
    nextMaintenance: '',
    notes: '',
  });

  const { data: equipment = [], isLoading, isError } = useQuery({
    queryKey: ['equipment', { search, categoryFilter, statusFilter }],
    queryFn: () => equipmentApi.getAll({
      search: search || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: equipmentApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['equipment'] }); setIsModalOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => equipmentApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['equipment'] }); setIsModalOpen(false); },
  });

  const operational = equipment.filter((m) => m.status === 'OPERATIONAL').length;
  const inRepair = equipment.filter((m) => m.status === 'MAINTENANCE').length;
  const dueSoonMachines = equipment.filter((m) => isDueSoon(m.nextMaintenance));

  const handleEdit = (machine: EquipmentType) => {
    setSelectedMachine(machine);
    setFormData({
      equipmentId: machine.equipmentId,
      name: machine.name,
      category: machine.category,
      status: machine.status,
      lastMaintenance: machine.lastMaintenance ? machine.lastMaintenance.split('T')[0] : '',
      nextMaintenance: machine.nextMaintenance ? machine.nextMaintenance.split('T')[0] : '',
      notes: machine.notes ?? '',
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMachine(null);
    setFormData({ equipmentId: '', name: '', category: 'OTHER', status: 'OPERATIONAL', lastMaintenance: '', nextMaintenance: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      equipmentId: formData.equipmentId,
      name: formData.name,
      category: formData.category,
      status: formData.status,
      lastMaintenance: formData.lastMaintenance || undefined,
      nextMaintenance: formData.nextMaintenance || undefined,
      notes: formData.notes || undefined,
    };
    if (selectedMachine) {
      updateMutation.mutate({ id: selectedMachine.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Equipment</h1>
        <button onClick={handleAddNew} className="btn-primary">+ Add Machine</button>
      </div>

      {/* Maintenance Due Soon Banner */}
      {dueSoonMachines.length > 0 && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1">
            <span className="text-sm font-bold text-amber-800 block mb-2">Maintenance Due Soon</span>
            <div className="flex flex-wrap gap-2">
              {dueSoonMachines.map((m) => {
                const days = getDaysUntil(m.nextMaintenance);
                return (
                  <span key={m.id} className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
                    {m.name}
                    <span className={days !== null && days <= 0 ? 'text-red-600' : 'text-amber-600'}>
                      {days !== null && days <= 0 ? 'Overdue' : `${days}d`}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-primary-100">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Machines</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : equipment.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-emerald-100">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Operational</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : operational}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-amber-100">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">In Repair</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : inRepair}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Maintenance Due</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : dueSoonMachines.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input">
              <option value="">All Categories</option>
              <option value="THREE_D_PRINTER">3D Printer</option>
              <option value="LASER_CUTTER">Laser Cutter</option>
              <option value="PIN_PRESS">Pin Press</option>
              <option value="DRONE">Drone</option>
              <option value="ROBOTICS">Robotics</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="MAINTENANCE">In Repair</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading equipment...</div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Failed to load equipment. Is the backend running?</div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No machines found</p>
            <button onClick={handleAddNew} className="btn-primary">Add your first machine</button>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Machine ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Maintenance</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Next Maintenance</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipment.map((machine) => (
                <tr key={machine.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                    {machine.equipmentId}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {machine.name}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                    {TYPE_LABELS[machine.category] ?? machine.category}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusBadge(machine.status)}`}>
                      {STATUS_LABEL[machine.status] ?? machine.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(machine.lastMaintenance)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    <span className={isDueSoon(machine.nextMaintenance) ? 'font-semibold text-red-600' : 'text-gray-500'}>
                      {formatDate(machine.nextMaintenance)}
                      {isDueSoon(machine.nextMaintenance) && (() => {
                        const days = getDaysUntil(machine.nextMaintenance);
                        return (
                          <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            {days !== null && days <= 0 ? 'Overdue' : `${days}d`}
                          </span>
                        );
                      })()}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(machine)} className="text-primary-600 hover:text-primary-700 font-semibold">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedMachine(null); }}
        title={selectedMachine ? 'Edit Machine' : 'Add New Machine'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Machine Name *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="Prusa i3 MK3S+"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Machine ID *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="EQ-001"
                value={formData.equipmentId}
                onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="THREE_D_PRINTER">3D Printer</option>
                <option value="LASER_CUTTER">Laser Cutter</option>
                <option value="PIN_PRESS">Pin Press</option>
                <option value="DRONE">Drone</option>
                <option value="ROBOTICS">Robotics</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="OPERATIONAL">Operational</option>
                <option value="MAINTENANCE">In Repair</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Maintenance</label>
              <input
                type="date"
                className="input"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Next Maintenance</label>
              <input
                type="date"
                className="input"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({ ...formData, nextMaintenance: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              className="input"
              placeholder="Maintenance notes, known issues..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selectedMachine ? 'Update Machine' : 'Add Machine'}
            </button>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setSelectedMachine(null); }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
