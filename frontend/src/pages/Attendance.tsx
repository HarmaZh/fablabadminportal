import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';

const mockSessions = [
  {
    id: 'SES-001',
    classId: '1',
    className: 'Introduction to 3D Printing',
    instructor: 'Maria Garcia',
    date: '2026-02-24',
    totalStudents: 12,
    present: 10,
    late: 1,
    absent: 1,
  },
  {
    id: 'SES-002',
    classId: '1',
    className: 'Introduction to 3D Printing',
    instructor: 'Maria Garcia',
    date: '2026-02-17',
    totalStudents: 12,
    present: 9,
    late: 0,
    absent: 3,
  },
  {
    id: 'SES-003',
    classId: '2',
    className: 'Advanced Laser Cutting',
    instructor: 'James Lee',
    date: '2026-02-25',
    totalStudents: 8,
    present: 7,
    late: 1,
    absent: 0,
  },
  {
    id: 'SES-004',
    classId: '2',
    className: 'Advanced Laser Cutting',
    instructor: 'James Lee',
    date: '2026-02-18',
    totalStudents: 8,
    present: 6,
    late: 0,
    absent: 2,
  },
  {
    id: 'SES-005',
    classId: '3',
    className: 'Pin Press & Badge Making',
    instructor: 'Priya Patel',
    date: '2026-02-26',
    totalStudents: 15,
    present: 12,
    late: 1,
    absent: 2,
  },
  {
    id: 'SES-006',
    classId: '3',
    className: 'Pin Press & Badge Making',
    instructor: 'Priya Patel',
    date: '2026-02-19',
    totalStudents: 15,
    present: 10,
    late: 0,
    absent: 5,
  },
  {
    id: 'SES-007',
    classId: '1',
    className: 'Introduction to 3D Printing',
    instructor: 'Maria Garcia',
    date: '2026-01-27',
    totalStudents: 12,
    present: 7,
    late: 0,
    absent: 5,
  },
  {
    id: 'SES-008',
    classId: '3',
    className: 'Pin Press & Badge Making',
    instructor: 'Priya Patel',
    date: '2026-01-29',
    totalStudents: 15,
    present: 14,
    late: 1,
    absent: 0,
  },
];

// Static mock roster for the "View Roster" modal
const mockRosters: Record<string, { studentId: string; name: string; status: 'Present' | 'Absent' | 'Late' }[]> = {
  'SES-001': [
    { studentId: 'STU-001', name: 'Emma Johnson', status: 'Present' },
    { studentId: 'STU-002', name: 'Liam Smith', status: 'Present' },
    { studentId: 'STU-003', name: 'Olivia Williams', status: 'Present' },
    { studentId: 'STU-004', name: 'Noah Brown', status: 'Absent' },
    { studentId: 'STU-005', name: 'Ava Davis', status: 'Present' },
    { studentId: 'STU-006', name: 'Isabella Martinez', status: 'Present' },
    { studentId: 'STU-007', name: 'Sophia Anderson', status: 'Late' },
    { studentId: 'STU-008', name: 'Mia Taylor', status: 'Present' },
    { studentId: 'STU-009', name: 'Charlotte Thomas', status: 'Present' },
    { studentId: 'STU-010', name: 'Amelia Jackson', status: 'Present' },
    { studentId: 'STU-011', name: 'Harper White', status: 'Present' },
    { studentId: 'STU-012', name: 'Evelyn Harris', status: 'Present' },
  ],
};

// Static class list for the "Take Attendance" modal
const MOCK_CLASS_STUDENTS = [
  'Emma Johnson', 'Liam Smith', 'Olivia Williams', 'Noah Brown',
  'Ava Davis', 'Isabella Martinez', 'Sophia Anderson', 'Mia Taylor',
  'Charlotte Thomas', 'Amelia Jackson',
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getAttendanceBadge = (present: number, total: number) => {
  const pct = total > 0 ? (present / total) * 100 : 0;
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700';
  if (pct >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const getRosterBadge = (status: string) => {
  if (status === 'Present') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Late') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

export const Attendance: React.FC = () => {
  const [sessions] = useState(mockSessions);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [rosterSession, setRosterSession] = useState<any>(null);
  const [isTakeModalOpen, setIsTakeModalOpen] = useState(false);

  // Take Attendance modal state
  const [takeClass, setTakeClass] = useState('');
  const [takeDate, setTakeDate] = useState(new Date().toISOString().split('T')[0]);
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MOCK_CLASS_STUDENTS.map((n) => [n, true]))
  );

  const filtered = sessions.filter((s) => {
    const matchesSearch =
      s.className.toLowerCase().includes(search.toLowerCase()) ||
      s.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !classFilter || s.classId === classFilter;
    const matchesStart = !startDate || s.date >= startDate;
    const matchesEnd = !endDate || s.date <= endDate;
    return matchesSearch && matchesClass && matchesStart && matchesEnd;
  });

  const sessionsThisMonth = sessions.filter((s) => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const avgRate = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + ((s.present + s.late) / s.totalStudents) * 100, 0) / sessions.length)
    : 0;

  const perfectSessions = sessions.filter((s) => s.absent === 0 && s.late === 0).length;
  const uniqueClasses = new Set(sessions.map((s) => s.classId)).size;

  const uniqueClassOptions = Array.from(
    new Map(sessions.map((s) => [s.classId, s.className])).entries()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Attendance Tracking</h1>
        <button onClick={() => setIsTakeModalOpen(true)} className="btn-primary">
          + Take Attendance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-primary-100">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sessions This Month</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{sessionsThisMonth}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-emerald-100">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg Attendance Rate</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{avgRate}%</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-amber-100">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Perfect Sessions</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{perfectSessions}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-sky-100">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Classes Tracked</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{uniqueClasses}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class or instructor..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input">
              <option value="">All Classes</option>
              {uniqueClassOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No sessions found</p>
            <button onClick={() => setIsTakeModalOpen(true)} className="btn-primary">Take Attendance</button>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Class</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Instructor</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Present</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Late</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Absent</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Attendance %</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((session) => {
                const pct = session.totalStudents > 0
                  ? Math.round(((session.present + session.late) / session.totalStudents) * 100)
                  : 0;
                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(session.date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.className}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.instructor}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-emerald-700">
                        {session.present}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${session.late > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {session.late}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${session.absent > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {session.absent}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getAttendanceBadge(session.present + session.late, session.totalStudents)}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setRosterSession(session)}
                        className="text-primary-600 hover:text-primary-700 font-semibold"
                      >
                        View Roster
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* View Roster Modal */}
      <Modal
        isOpen={!!rosterSession}
        onClose={() => setRosterSession(null)}
        title={rosterSession ? `Attendance — ${rosterSession.className}` : ''}
      >
        {rosterSession && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">{formatDate(rosterSession.date)} · {rosterSession.instructor}</p>
            <div className="flex gap-4 text-sm font-semibold">
              <span className="text-emerald-700">Present: {rosterSession.present}</span>
              <span className="text-amber-600">Late: {rosterSession.late}</span>
              <span className="text-red-600">Absent: {rosterSession.absent}</span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(mockRosters[rosterSession.id] ?? Array.from({ length: rosterSession.totalStudents }, (_, i) => ({
                studentId: `STU-${String(i + 1).padStart(3, '0')}`,
                name: `Student ${i + 1}`,
                status: i < rosterSession.present ? 'Present' : 'Absent',
              } as { studentId: string; name: string; status: 'Present' | 'Absent' | 'Late' }))).map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.studentId}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getRosterBadge(student.status)}`}>
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100">
              <button onClick={() => setRosterSession(null)} className="btn-secondary w-full">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Take Attendance Modal */}
      <Modal
        isOpen={isTakeModalOpen}
        onClose={() => setIsTakeModalOpen(false)}
        title="Take Attendance"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Class *</label>
              <select value={takeClass} onChange={(e) => setTakeClass(e.target.value)} className="input">
                <option value="">Select Class</option>
                {uniqueClassOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
              <input type="date" value={takeDate} onChange={(e) => setTakeDate(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Student Roster</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {MOCK_CLASS_STUDENTS.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className="text-sm font-medium text-gray-900">{name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPresentMap((prev) => ({ ...prev, [name]: true }))}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        presentMap[name] ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresentMap((prev) => ({ ...prev, [name]: false }))}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        !presentMap[name] ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500 font-medium">
            {Object.values(presentMap).filter(Boolean).length} / {MOCK_CLASS_STUDENTS.length} present
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => setIsTakeModalOpen(false)}
            >
              Submit Attendance
            </button>
            <button
              type="button"
              onClick={() => setIsTakeModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Sample Data Notice */}
      <div className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-lg">
        <p className="text-sm text-primary-700 font-medium">
          <strong>Note:</strong> This page uses sample data for UI demonstration.
          Backend integration for attendance tracking will be added when ready.
        </p>
      </div>
    </div>
  );
};
