import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../components/common/Modal';
import { staffApi } from '../api/staff';
import { StaffMember } from '../types';

const ROLE_BADGE: Record<string, string> = {
  INSTRUCTOR: 'bg-primary-100 text-primary-700',
  ADMIN: 'bg-violet-100 text-violet-700',
  COORDINATOR: 'bg-sky-100 text-sky-700',
  VOLUNTEER: 'bg-emerald-100 text-emerald-700',
};

const ROLE_LABEL: Record<string, string> = {
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
  COORDINATOR: 'Coordinator',
  VOLUNTEER: 'Volunteer',
};

export const Staff: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'INSTRUCTOR',
    specialization: '',
    active: true,
  });

  const { data: staff = [], isLoading, isError } = useQuery({
    queryKey: ['staff', { search, roleFilter }],
    queryFn: () => staffApi.getAll({ search: search || undefined, role: roleFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); setIsModalOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => staffApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); setIsModalOpen(false); },
  });

  const activeInstructors = staff.filter((s) => s.role === 'INSTRUCTOR' && s.active).length;
  const coordinators = staff.filter((s) => s.role === 'COORDINATOR').length;
  const volunteers = staff.filter((s) => s.role === 'VOLUNTEER').length;

  const handleEdit = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone ?? '',
      role: member.role,
      specialization: member.specialization ?? '',
      active: member.active,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStaff(null);
    setFormData({ name: '', email: '', phone: '', role: 'INSTRUCTOR', specialization: '', active: true });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role,
      specialization: formData.specialization || undefined,
      active: formData.active,
    };
    if (selectedStaff) {
      updateMutation.mutate({ id: selectedStaff.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Staff & Instructors</h1>
        <button onClick={handleAddNew} className="btn-primary">+ Add Staff</button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-primary-100">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Staff</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : staff.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-emerald-100">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Active Instructors</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : activeInstructors}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-sky-100">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Coordinators</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : coordinators}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-amber-100">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Volunteers</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : volunteers}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input">
              <option value="">All Roles</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="ADMIN">Admin</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="VOLUNTEER">Volunteer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading staff...</div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Failed to load staff. Is the backend running?</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No staff found</p>
            <button onClick={handleAddNew} className="btn-primary">Add your first staff member</button>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Staff ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Specialization</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Classes</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                    {member.staffId ?? '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {member.name}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${ROLE_BADGE[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[member.role] ?? member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.specialization ?? '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-sky-100 text-sky-700 rounded-md">
                      {member._count?.classes ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${member.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(member)} className="text-primary-600 hover:text-primary-700 font-semibold">
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
        onClose={() => { setIsModalOpen(false); setSelectedStaff(null); }}
        title={selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="Maria Garcia"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              required
              className="input"
              placeholder="staff@fablab.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
              <select
                className="input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
                <option value="COORDINATOR">Coordinator</option>
                <option value="VOLUNTEER">Volunteer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 3D Printing & Laser Cutting"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              className="input"
              value={formData.active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selectedStaff ? 'Update Staff Member' : 'Add Staff Member'}
            </button>
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setSelectedStaff(null); }}
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
