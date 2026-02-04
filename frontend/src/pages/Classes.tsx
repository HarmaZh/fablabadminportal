import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';

// Mock class data for UI demonstration
const mockClasses = [
  {
    id: '1',
    courseId: 'CLS-2024-001',
    name: 'Introduction to 3D Printing',
    instructor: 'John Smith',
    schedule: 'Mon & Wed 4-6 PM',
    capacity: 15,
    enrolled: 12,
    status: 'Active',
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    description: 'Learn the basics of 3D modeling and printing',
  },
  {
    id: '2',
    courseId: 'CLS-2024-002',
    name: 'Advanced Laser Cutting',
    instructor: 'Sarah Johnson',
    schedule: 'Tue & Thu 3-5 PM',
    capacity: 12,
    enrolled: 8,
    status: 'Active',
    startDate: '2024-01-16',
    endDate: '2024-03-20',
    description: 'Advanced techniques for laser cutting and design',
  },
  {
    id: '3',
    courseId: 'CLS-2024-003',
    name: 'Electronics Basics',
    instructor: 'Mike Chen',
    schedule: 'Wed 6-8 PM',
    capacity: 15,
    enrolled: 15,
    status: 'Active',
    startDate: '2024-01-10',
    endDate: '2024-03-28',
    description: 'Introduction to circuits and basic electronics',
  },
  {
    id: '4',
    courseId: 'CLS-2024-004',
    name: 'Robotics Workshop',
    instructor: 'Emily Davis',
    schedule: 'Fri 4-7 PM',
    capacity: 10,
    enrolled: 5,
    status: 'Upcoming',
    startDate: '2024-02-02',
    endDate: '2024-04-12',
    description: 'Build and program your own robot',
  },
  {
    id: '5',
    courseId: 'CLS-2023-015',
    name: 'Woodworking 101',
    instructor: 'David Brown',
    schedule: 'Sat 10-1 PM',
    capacity: 10,
    enrolled: 10,
    status: 'Completed',
    startDate: '2023-09-15',
    endDate: '2023-12-15',
    description: 'Learn essential woodworking skills and safety',
  },
  {
    id: '6',
    courseId: 'CLS-2024-005',
    name: 'CNC Machining',
    instructor: 'Lisa White',
    schedule: 'Thu 5-7 PM',
    capacity: 8,
    enrolled: 6,
    status: 'Active',
    startDate: '2024-01-18',
    endDate: '2024-03-21',
    description: 'Master CNC machine operation and programming',
  },
];

const COLOR_CLASSES = [
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9 AM through 9 PM

function parseSchedule(schedule: string): { days: number[]; startHour: number; endHour: number } | null {
  const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

  const match = schedule.match(/(\d+)-(\d+)\s*(AM|PM)/);
  if (!match) return null;

  const startNum = parseInt(match[1]);
  const endNum = parseInt(match[2]);
  const period = match[3];

  let startHour: number, endHour: number;

  if (period === 'PM') {
    if (startNum > endNum) {
      // "10-1 PM" → 10 AM to 1 PM
      startHour = startNum;
      endHour = endNum + 12;
    } else {
      startHour = startNum === 12 ? 12 : startNum + 12;
      endHour = endNum === 12 ? 12 : endNum + 12;
    }
  } else {
    startHour = startNum === 12 ? 0 : startNum;
    endHour = endNum === 12 ? 0 : endNum;
  }

  const days: number[] = [];
  for (const [name, idx] of Object.entries(dayMap)) {
    if (schedule.includes(name)) days.push(idx);
  }

  return { days, startHour, endHour };
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export const Classes: React.FC = () => {
  const [classes] = useState(mockClasses);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [activeView, setActiveView] = useState<'table' | 'calendar'>('table');

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.courseId.toLowerCase().includes(search.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || cls.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeClasses = classes.filter((c) => c.status === 'Active').length;
  const totalEnrollments = classes.reduce((sum, c) => sum + c.enrolled, 0);
  const avgEnrollment = classes.length > 0
    ? (totalEnrollments / classes.length).toFixed(1)
    : '0';

  const handleEdit = (cls: any) => {
    setSelectedClass(cls);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-jet-black">Class Management</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-pale-sky/20 rounded-lg p-1">
            <button
              onClick={() => setActiveView('table')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeView === 'table'
                  ? 'bg-white text-jet-black shadow-sm'
                  : 'text-primary-700 hover:text-jet-black'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeView === 'calendar'
                  ? 'bg-white text-jet-black shadow-sm'
                  : 'text-primary-700 hover:text-jet-black'
              }`}
            >
              Calendar
            </button>
          </div>
          <button onClick={handleAddNew} className="btn-primary">
            + Add Class
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-white to-pale-sky/20 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-primary-600 mb-2 uppercase tracking-wide">
            Total Classes
          </h3>
          <p className="text-4xl font-bold text-jet-black">{classes.length}</p>
        </div>

        <div className="card bg-gradient-to-br from-white to-green-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">
            Active Classes
          </h3>
          <p className="text-4xl font-bold text-green-600">{activeClasses}</p>
        </div>

        <div className="card bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
            Total Enrollments
          </h3>
          <p className="text-4xl font-bold text-blue-600">{totalEnrollments}</p>
        </div>

        <div className="card bg-gradient-to-br from-white to-purple-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-purple-700 mb-2 uppercase tracking-wide">
            Avg Enrollment
          </h3>
          <p className="text-4xl font-bold text-purple-600">{avgEnrollment}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, course ID, or instructor..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      {activeView === 'table' && (
      <div className="card overflow-x-auto">
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-primary-600 text-lg mb-4">No classes found</p>
            <button onClick={handleAddNew} className="btn-primary">
              Add your first class
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-pale-sky">
            <thead className="bg-gradient-to-r from-pale-sky/30 to-light-blue/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Course ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Enrollment
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-jet-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-pale-sky/50">
              {filteredClasses.map((cls) => (
                <tr
                  key={cls.id}
                  className="hover:bg-pale-sky/10 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-700">
                    {cls.courseId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-jet-black">
                    {cls.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {cls.instructor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {cls.schedule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-sm font-bold rounded-full ${
                        cls.enrolled >= cls.capacity
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {cls.enrolled}/{cls.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        cls.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : cls.status === 'Upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cls.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Start: {formatDate(cls.startDate)}</span>
                      <span className="text-xs text-gray-500">End: {formatDate(cls.endDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEdit(cls)}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Edit
                    </button>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold">
                      View Enrollments
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* Weekly Calendar */}
      {activeView === 'calendar' && (
        <div className="card overflow-x-auto">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '4rem repeat(7, 1fr)',
              gridTemplateRows: '2.5rem repeat(13, 3rem)',
              minWidth: '700px',
            }}
          >
            {/* Corner cell */}
            <div className="border-b-2 border-pale-sky border-r border-pale-sky/30 bg-pale-sky/10" />

            {/* Day headers */}
            {DAYS.map((day, dayIdx) => (
              <div
                key={day}
                className="border-b-2 border-pale-sky border-l border-pale-sky/30 bg-pale-sky/10 flex items-center justify-center text-xs font-bold text-jet-black uppercase tracking-wider"
                style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
              >
                {day}
              </div>
            ))}

            {/* Time labels */}
            {HOURS.map((hour, hourIdx) => (
              <div
                key={hour}
                className="border-b border-pale-sky/20 flex items-start justify-end pr-2 pt-0.5"
                style={{ gridColumn: 1, gridRow: hourIdx + 2 }}
              >
                <span className="text-xs text-primary-600 font-medium">{formatHour(hour)}</span>
              </div>
            ))}

            {/* Background grid cells */}
            {HOURS.map((_, hourIdx) =>
              DAYS.map((_, dayIdx) => (
                <div
                  key={`bg-${hourIdx}-${dayIdx}`}
                  className="border-b border-pale-sky/20 border-l border-pale-sky/30"
                  style={{ gridColumn: dayIdx + 2, gridRow: hourIdx + 2 }}
                />
              ))
            )}

            {/* Event blocks */}
            {filteredClasses.flatMap((cls) => {
              const classIdx = classes.findIndex((c) => c.id === cls.id);
              const parsed = parseSchedule(cls.schedule);
              if (!parsed) return [];
              const color = COLOR_CLASSES[classIdx % COLOR_CLASSES.length];

              return parsed.days.map((dayIdx) => (
                <div
                  key={`${cls.id}-${dayIdx}`}
                  style={{
                    gridColumn: dayIdx + 2,
                    gridRow: `${parsed.startHour - 7} / ${parsed.endHour - 7}`,
                    zIndex: 1,
                  }}
                  className={`${color.bg} ${color.border} ${color.text} border rounded p-1 m-0.5 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => handleEdit(cls)}
                >
                  <p className="text-xs font-bold truncate">{cls.name}</p>
                  <div>
                    <p className="text-xs">{formatHour(parsed.startHour)}–{formatHour(parsed.endHour)}</p>
                    <p className="text-xs opacity-75 truncate">{cls.instructor}</p>
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClass(null);
        }}
        title={selectedClass ? 'Edit Class' : 'Add New Class'}
      >
        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Class Name *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Introduction to 3D Printing"
                defaultValue={selectedClass?.name}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Instructor *
              </label>
              <input
                type="text"
                className="input"
                placeholder="John Smith"
                defaultValue={selectedClass?.instructor}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Course ID
            </label>
            <input
              type="text"
              className="input"
              placeholder="CLS-2024-001"
              defaultValue={selectedClass?.courseId}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="input"
              placeholder="Course description..."
              defaultValue={selectedClass?.description}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Schedule *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Mon & Wed 4-6 PM"
                defaultValue={selectedClass?.schedule}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Max Capacity *
              </label>
              <input
                type="number"
                className="input"
                placeholder="15"
                defaultValue={selectedClass?.capacity}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Start Date *
              </label>
              <input
                type="date"
                className="input"
                defaultValue={selectedClass?.startDate}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                End Date *
              </label>
              <input
                type="date"
                className="input"
                defaultValue={selectedClass?.endDate}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Status *
            </label>
            <select className="input" defaultValue={selectedClass?.status}>
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-pale-sky">
            <button type="button" className="btn-primary flex-1">
              {selectedClass ? 'Update Class' : 'Add Class'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedClass(null);
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Sample Data Notice */}
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium">
          📝 <strong>Note:</strong> This page uses sample data for UI demonstration.
          Backend integration for class management will be added when ready.
        </p>
      </div>
    </div>
  );
};
