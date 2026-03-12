import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';

const mockStaff = [
  {
    id: '1',
    staffId: 'STF-001',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.g@fablab.org',
    phone: '(555) 101-2020',
    role: 'Instructor',
    specialties: ['3D Printing', 'Laser Cutting'],
    school: null,
    status: 'Active',
    classesCount: 3,
  },
  {
    id: '2',
    staffId: 'STF-002',
    firstName: 'James',
    lastName: 'Lee',
    email: 'james.l@fablab.org',
    phone: '(555) 202-3030',
    role: 'Instructor',
    specialties: ['Electronics', 'Robotics'],
    school: null,
    status: 'Active',
    classesCount: 2,
  },
  {
    id: '3',
    staffId: 'STF-003',
    firstName: 'Diana',
    lastName: 'Torres',
    email: 'diana.t@fablab.org',
    phone: '(555) 303-4040',
    role: 'Admin',
    specialties: ['Operations', 'Scheduling'],
    school: null,
    status: 'Active',
    classesCount: 0,
  },
  {
    id: '4',
    staffId: 'STF-004',
    firstName: 'Kevin',
    lastName: 'Nguyen',
    email: 'kevin.n@fablab.org',
    phone: '(555) 404-5050',
    role: 'Volunteer',
    specialties: ['Pin Press', 'Arts & Crafts'],
    school: null,
    status: 'Active',
    classesCount: 1,
  },
  {
    id: '5',
    staffId: 'STF-005',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.p@fablab.org',
    phone: '(555) 505-6060',
    role: 'YMCA Coordinator',
    specialties: ['3D Printing', 'Pin Press', 'Arts & Crafts'],
    school: 'Lincoln Middle School',
    status: 'Active',
    classesCount: 2,
  },
  {
    id: '6',
    staffId: 'STF-006',
    firstName: 'Marcus',
    lastName: 'Williams',
    email: 'marcus.w@fablab.org',
    phone: '(555) 606-7070',
    role: 'YMCA Coordinator',
    specialties: ['Laser Cutting', 'Electronics'],
    school: 'Roosevelt Middle School',
    status: 'Active',
    classesCount: 2,
  },
];

const ROLE_BADGE: Record<string, string> = {
  Instructor: 'bg-primary-100 text-primary-700',
  Admin: 'bg-violet-100 text-violet-700',
  'YMCA Coordinator': 'bg-sky-100 text-sky-700',
  Volunteer: 'bg-emerald-100 text-emerald-700',
};

export const Staff: React.FC = () => {
  const [staff] = useState(mockStaff);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const filtered = staff.filter((s) => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.staffId.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || s.role === roleFilter;
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeInstructors = staff.filter((s) => s.role === 'Instructor' && s.status === 'Active').length;
  const ymcaCount = staff.filter((s) => s.role === 'YMCA Coordinator').length;
  const volunteers = staff.filter((s) => s.role === 'Volunteer').length;

  const handleEdit = (member: any) => {
    setSelectedStaff(member);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Staff & Instructors</h1>
        <button onClick={handleAddNew} className="btn-primary">
          + Add Staff
        </button>
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
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{staff.length}</p>
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
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{activeInstructors}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-sky-100">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">YMCA Outreach</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{ymcaCount}</p>
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
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{volunteers}</p>
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
              placeholder="Search by name, email, or ID..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input">
              <option value="">All Roles</option>
              <option value="Instructor">Instructor</option>
              <option value="Admin">Admin</option>
              <option value="YMCA Coordinator">YMCA Coordinator</option>
              <option value="Volunteer">Volunteer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {filtered.length === 0 ? (
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Specialties</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">School</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                    {member.staffId}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${ROLE_BADGE[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.email}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {member.specialties.slice(0, 2).map((s) => (
                        <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md whitespace-nowrap">
                          {s}
                        </span>
                      ))}
                      {member.specialties.length > 2 && (
                        <span className="bg-primary-50 text-primary-600 text-xs px-2 py-0.5 rounded-md whitespace-nowrap">
                          +{member.specialties.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    {member.school ? (
                      <span className="text-gray-700 font-medium">{member.school}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                      member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(member)}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
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
        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
              <input type="text" className="input" placeholder="Maria" defaultValue={selectedStaff?.firstName} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
              <input type="text" className="input" placeholder="Garcia" defaultValue={selectedStaff?.lastName} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
            <input type="email" className="input" placeholder="staff@fablab.org" defaultValue={selectedStaff?.email} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
            <input type="tel" className="input" placeholder="(555) 123-4567" defaultValue={selectedStaff?.phone} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
              <select className="input" defaultValue={selectedStaff?.role}>
                <option value="">Select Role</option>
                <option value="Instructor">Instructor</option>
                <option value="Admin">Admin</option>
                <option value="YMCA Coordinator">YMCA Coordinator</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
              <select className="input" defaultValue={selectedStaff?.status ?? 'Active'}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Specialties</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 3D Printing, Laser Cutting"
              defaultValue={selectedStaff?.specialties?.join(', ')}
            />
            <p className="mt-1 text-xs text-gray-400">Separate multiple specialties with commas.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Outreach School</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Lincoln Middle School"
              defaultValue={selectedStaff?.school ?? ''}
            />
            <p className="mt-1 text-xs text-gray-400">For YMCA Coordinators — leave blank if not applicable.</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" className="btn-primary flex-1">
              {selectedStaff ? 'Update Staff Member' : 'Add Staff Member'}
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

      {/* Sample Data Notice */}
      <div className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-lg">
        <p className="text-sm text-primary-700 font-medium">
          <strong>Note:</strong> This page uses sample data for UI demonstration.
          Backend integration for staff management will be added when ready.
        </p>
      </div>
    </div>
  );
};
