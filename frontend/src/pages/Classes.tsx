import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';

// Mock class data for UI demonstration
const mockClasses = [
  {
    id: '1',
    courseId: 'CLS-2026-001',
    name: 'Introduction to 3D Printing',
    instructor: 'John Smith',
    schedule: 'Mon & Wed 4-6 PM',
    capacity: 15,
    enrolled: 12,
    status: 'Active',
    startDate: '2026-01-05',
    endDate: '2026-06-30',
    description: 'Learn the basics of 3D modeling and printing',
  },
  {
    id: '2',
    courseId: 'CLS-2026-002',
    name: 'Advanced Laser Cutting',
    instructor: 'Sarah Johnson',
    schedule: 'Tue & Thu 3-5 PM',
    capacity: 12,
    enrolled: 8,
    status: 'Active',
    startDate: '2026-01-06',
    endDate: '2026-05-30',
    description: 'Advanced techniques for laser cutting and design',
  },
  {
    id: '3',
    courseId: 'CLS-2026-003',
    name: 'Electronics Basics',
    instructor: 'Mike Chen',
    schedule: 'Wed 6-8 PM',
    capacity: 15,
    enrolled: 15,
    status: 'Active',
    startDate: '2026-02-01',
    endDate: '2026-05-30',
    description: 'Introduction to circuits and basic electronics',
  },
  {
    id: '4',
    courseId: 'CLS-2026-004',
    name: 'Robotics Workshop',
    instructor: 'Emily Davis',
    schedule: 'Fri 4-7 PM',
    capacity: 10,
    enrolled: 5,
    status: 'Active',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    description: 'Build and program your own robot',
  },
  {
    id: '5',
    courseId: 'CLS-2025-015',
    name: 'Woodworking 101',
    instructor: 'David Brown',
    schedule: 'Sat 10-1 PM',
    capacity: 10,
    enrolled: 10,
    status: 'Completed',
    startDate: '2025-09-15',
    endDate: '2025-12-15',
    description: 'Learn essential woodworking skills and safety',
  },
  {
    id: '6',
    courseId: 'CLS-2026-005',
    name: 'CNC Machining',
    instructor: 'Lisa White',
    schedule: 'Thu 5-7 PM',
    capacity: 8,
    enrolled: 6,
    status: 'Active',
    startDate: '2026-01-18',
    endDate: '2026-05-30',
    description: 'Master CNC machine operation and programming',
  },
];

const COLOR_CLASSES = [
  { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-500' },
  { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-500'   },
  { bg: 'bg-rose-100',    text: 'text-rose-700',     border: 'border-rose-500'    },
  { bg: 'bg-sky-100',     text: 'text-sky-700',      border: 'border-sky-500'     },
  { bg: 'bg-orange-100',  text: 'text-orange-700',   border: 'border-orange-500'  },
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

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const grid: (Date | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) grid.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function getClassesForDay(date: Date, cls: typeof mockClasses): typeof mockClasses {
  const dateStr = date.toISOString().split('T')[0];
  const fabDow = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return cls.filter((c) => {
    if (dateStr < c.startDate || dateStr > c.endDate) return false;
    const parsed = parseSchedule(c.schedule);
    return parsed ? parsed.days.includes(fabDow) : false;
  });
}

export const Classes: React.FC = () => {
  const [classes] = useState(mockClasses);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [activeView, setActiveView] = useState<'table' | 'week' | 'month'>('table');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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

  const monthGrid = getMonthGrid(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Class Management</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('table')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeView === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setActiveView('week')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeView === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setActiveView('month')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeView === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Month
            </button>
          </div>
          <button onClick={handleAddNew} className="btn-primary">
            + Add Class
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-primary-100">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Classes</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{classes.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-emerald-100">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Active Classes</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{activeClasses}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-sky-100">
            <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Enrollments</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{totalEnrollments}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-violet-100">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg Enrollment</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{avgEnrollment}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
        <div className="card overflow-x-auto p-0">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No classes found</p>
              <button onClick={handleAddNew} className="btn-primary">
                Add your first class
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Course ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Class Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Instructor
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Schedule
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Enrollment
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Dates
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClasses.map((cls) => {
                  const colorIdx = classes.findIndex((c) => c.id === cls.id);
                  const color = COLOR_CLASSES[colorIdx % COLOR_CLASSES.length];
                  return (
                    <tr
                      key={cls.id}
                      className={`table-row-accent ${color.border} hover:bg-gray-50`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                        {cls.courseId}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cls.name}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cls.instructor}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cls.schedule}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                            <div
                              className="bg-primary-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min((cls.enrolled / cls.capacity) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 tabular-nums whitespace-nowrap">
                            {cls.enrolled}/{cls.capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                            cls.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : cls.status === 'Upcoming'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {cls.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs">{formatDate(cls.startDate)}</span>
                          <span className="text-xs text-gray-400">{formatDate(cls.endDate)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(cls)}
                          className="text-primary-600 hover:text-primary-700 font-semibold"
                        >
                          Edit
                        </button>
                        <button className="text-gray-500 hover:text-gray-700 font-semibold">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Weekly Calendar */}
      {activeView === 'week' && (
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
            <div className="border-b-2 border-gray-200 border-r border-gray-100 bg-gray-50" />

            {/* Day headers */}
            {DAYS.map((day, dayIdx) => (
              <div
                key={day}
                className="border-b-2 border-gray-200 border-l border-gray-100 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700 uppercase tracking-wider"
                style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
              >
                {day}
              </div>
            ))}

            {/* Time labels */}
            {HOURS.map((hour, hourIdx) => (
              <div
                key={hour}
                className="border-b border-gray-100 flex items-start justify-end pr-2 pt-0.5"
                style={{ gridColumn: 1, gridRow: hourIdx + 2 }}
              >
                <span className="text-xs text-gray-400 font-medium">{formatHour(hour)}</span>
              </div>
            ))}

            {/* Background grid cells */}
            {HOURS.map((_, hourIdx) =>
              DAYS.map((_, dayIdx) => (
                <div
                  key={`bg-${hourIdx}-${dayIdx}`}
                  className="border-b border-gray-100 border-l border-gray-100"
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
                  className={`${color.bg} ${color.text} border-l-2 ${color.border} rounded-md p-1 m-0.5 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer`}
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

      {/* Monthly Calendar */}
      {activeView === 'month' && (
        <div className="card p-0 overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-bold text-gray-900">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 border-t border-l border-gray-100">
            {monthGrid.map((date, idx) => {
              const isToday = date?.toDateString() === new Date().toDateString();
              const dayClasses = date ? getClassesForDay(date, filteredClasses) : [];
              return (
                <div
                  key={idx}
                  className={`border-b border-r border-gray-100 min-h-[100px] p-2 ${
                    !date ? 'bg-gray-50/60' : 'hover:bg-gray-50 transition-colors'
                  }`}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayClasses.map((cls) => {
                          const colorIdx = classes.findIndex((c) => c.id === cls.id);
                          const color = COLOR_CLASSES[colorIdx % COLOR_CLASSES.length];
                          return (
                            <div
                              key={cls.id}
                              onClick={() => handleEdit(cls)}
                              title={`${cls.name} — ${cls.schedule}`}
                              className={`${color.bg} ${color.text} text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:shadow-sm transition-shadow`}
                            >
                              {cls.name}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                className="input"
                defaultValue={selectedClass?.startDate}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status *
            </label>
            <select className="input" defaultValue={selectedClass?.status}>
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
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
      <div className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-lg">
        <p className="text-sm text-primary-700 font-medium">
          <strong>Note:</strong> This page uses sample data for UI demonstration.
          Backend integration for class management will be added when ready.
        </p>
      </div>
    </div>
  );
};
