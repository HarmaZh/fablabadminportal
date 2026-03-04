import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';

const mockMachines = [
  {
    id: '1',
    machineId: 'MCH-001',
    name: 'Prusa i3 MK3S+',
    type: 'THREE_D_PRINTER',
    status: 'Operational',
    location: 'Lab A',
    lastMaintenance: '2026-02-10',
    nextMaintenance: '2026-05-10',
    notes: 'New nozzle installed Feb 2026.',
  },
  {
    id: '2',
    machineId: 'MCH-002',
    name: 'Creality Ender 3 V2',
    type: 'THREE_D_PRINTER',
    status: 'Operational',
    location: 'Lab A',
    lastMaintenance: '2026-01-20',
    nextMaintenance: '2026-04-20',
    notes: '',
  },
  {
    id: '3',
    machineId: 'MCH-003',
    name: 'Bambu Lab X1 Carbon',
    type: 'THREE_D_PRINTER',
    status: 'In Repair',
    location: 'Lab B',
    lastMaintenance: '2025-12-05',
    nextMaintenance: '2026-03-05',
    notes: 'Extruder clog — parts ordered.',
  },
  {
    id: '4',
    machineId: 'MCH-004',
    name: 'Glowforge Pro',
    type: 'LASER_CUTTER',
    status: 'Operational',
    location: 'Lab A',
    lastMaintenance: '2026-02-01',
    nextMaintenance: '2026-05-01',
    notes: 'Lens cleaned.',
  },
  {
    id: '5',
    machineId: 'MCH-005',
    name: 'xTool D1 Pro',
    type: 'LASER_CUTTER',
    status: 'Offline',
    location: 'Lab B',
    lastMaintenance: '2025-11-15',
    nextMaintenance: '2026-02-15',
    notes: 'Awaiting inspection. Overdue for maintenance.',
  },
  {
    id: '6',
    machineId: 'MCH-006',
    name: 'Badge Button Maker 2.25"',
    type: 'PIN_PRESS',
    status: 'Operational',
    location: 'Storage Room',
    lastMaintenance: '2026-01-10',
    nextMaintenance: '2026-07-10',
    notes: '',
  },
  {
    id: '7',
    machineId: 'MCH-007',
    name: 'Badge Button Maker 1.5"',
    type: 'PIN_PRESS',
    status: 'Operational',
    location: 'Storage Room',
    lastMaintenance: '2026-01-10',
    nextMaintenance: '2026-07-10',
    notes: '',
  },
  {
    id: '8',
    machineId: 'MCH-008',
    name: 'Cricut Maker 3',
    type: 'OTHER',
    status: 'Operational',
    location: 'Lab B',
    lastMaintenance: '2026-01-25',
    nextMaintenance: '2026-06-25',
    notes: 'Vinyl cutter for art projects.',
  },
];

const TYPE_LABELS: Record<string, string> = {
  THREE_D_PRINTER: '3D Printer',
  LASER_CUTTER: 'Laser Cutter',
  PIN_PRESS: 'Pin Press',
  OTHER: 'Other',
};

const isDueSoon = (dateStr: string) => {
  const due = new Date(dateStr);
  const today = new Date();
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const Equipment: React.FC = () => {
  const [machines] = useState(mockMachines);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  const filtered = machines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.machineId.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || m.type === typeFilter;
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const operational = machines.filter((m) => m.status === 'Operational').length;
  const inRepair = machines.filter((m) => m.status === 'In Repair').length;
  const maintenanceDue = machines.filter((m) => isDueSoon(m.nextMaintenance)).length;

  const handleEdit = (machine: any) => {
    setSelectedMachine(machine);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMachine(null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Operational: 'bg-green-100 text-green-700',
      'In Repair': 'bg-yellow-100 text-yellow-700',
      Offline: 'bg-red-100 text-red-700',
      Retired: 'bg-gray-100 text-gray-600',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-jet-black">Equipment</h1>
        <button onClick={handleAddNew} className="btn-primary">
          + Add Machine
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-primary-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-1">Total Machines</p>
            <p className="text-3xl font-bold text-jet-black leading-none">{machines.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Operational</p>
            <p className="text-3xl font-bold text-jet-black leading-none">{operational}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-yellow-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">In Repair</p>
            <p className="text-3xl font-bold text-jet-black leading-none">{inRepair}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Maintenance Due</p>
            <p className="text-3xl font-bold text-jet-black leading-none">{maintenanceDue}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input">
              <option value="">All Types</option>
              <option value="THREE_D_PRINTER">3D Printer</option>
              <option value="LASER_CUTTER">Laser Cutter</option>
              <option value="PIN_PRESS">Pin Press</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">All Statuses</option>
              <option value="Operational">Operational</option>
              <option value="In Repair">In Repair</option>
              <option value="Offline">Offline</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-primary-600 text-lg mb-4">No machines found</p>
            <button onClick={handleAddNew} className="btn-primary">Add your first machine</button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-pale-sky">
            <thead className="bg-gradient-to-r from-pale-sky/30 to-light-blue/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">Machine ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">Last Maintenance</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">Next Maintenance</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-jet-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-pale-sky/50">
              {filtered.map((machine) => (
                <tr key={machine.id} className="hover:bg-pale-sky/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-700">
                    {machine.machineId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-jet-black">
                    {machine.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {TYPE_LABELS[machine.type] ?? machine.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadge(machine.status)}`}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {machine.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {formatDate(machine.lastMaintenance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={isDueSoon(machine.nextMaintenance) ? 'font-bold text-red-600' : 'text-primary-600'}>
                      {formatDate(machine.nextMaintenance)}
                      {isDueSoon(machine.nextMaintenance) && ' ⚠'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(machine)}
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
        onClose={() => { setIsModalOpen(false); setSelectedMachine(null); }}
        title={selectedMachine ? 'Edit Machine' : 'Add New Machine'}
      >
        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">Machine Name *</label>
              <input type="text" className="input" placeholder="Prusa i3 MK3S+" defaultValue={selectedMachine?.name} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">Machine ID *</label>
              <input type="text" className="input" placeholder="MCH-009" defaultValue={selectedMachine?.machineId} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">Type *</label>
              <select className="input" defaultValue={selectedMachine?.type}>
                <option value="">Select Type</option>
                <option value="THREE_D_PRINTER">3D Printer</option>
                <option value="LASER_CUTTER">Laser Cutter</option>
                <option value="PIN_PRESS">Pin Press</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">Status *</label>
              <select className="input" defaultValue={selectedMachine?.status}>
                <option value="">Select Status</option>
                <option value="Operational">Operational</option>
                <option value="In Repair">In Repair</option>
                <option value="Offline">Offline</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">Location</label>
            <input type="text" className="input" placeholder="Lab A" defaultValue={selectedMachine?.location} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">Last Maintenance</label>
              <input type="date" className="input" defaultValue={selectedMachine?.lastMaintenance} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">Next Maintenance</label>
              <input type="date" className="input" defaultValue={selectedMachine?.nextMaintenance} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">Notes</label>
            <textarea rows={3} className="input" placeholder="Maintenance notes, known issues..." defaultValue={selectedMachine?.notes} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-pale-sky/30">
            <button type="button" className="btn-primary flex-1">
              {selectedMachine ? 'Update Machine' : 'Add Machine'}
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

      {/* Sample Data Notice */}
      <div className="mt-6 p-4 bg-pale-sky/20 border border-pale-sky rounded-lg">
        <p className="text-sm text-jet-black font-medium">
          <strong>Note:</strong> This page uses sample data for UI demonstration.
          Backend integration for equipment management will be added when ready.
        </p>
      </div>
    </div>
  );
};
