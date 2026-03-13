import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../components/common/Modal';
import { attendanceApi } from '../api/attendance';
import { AttendanceRecord } from '../types';

interface Session {
  key: string;
  classId: string;
  className: string;
  instructor: string;
  date: string;
  records: AttendanceRecord[];
  present: number;
  late: number;
  absent: number;
  total: number;
}

function groupIntoSessions(records: AttendanceRecord[]): Session[] {
  const map = new Map<string, Session>();
  for (const r of records) {
    const dateStr = r.date.split('T')[0];
    const key = `${r.classId}::${dateStr}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        classId: r.classId,
        className: r.class?.name ?? r.classId,
        instructor: r.class?.instructor?.name ?? '—',
        date: dateStr,
        records: [],
        present: 0,
        late: 0,
        absent: 0,
        total: 0,
      });
    }
    const session = map.get(key)!;
    session.records.push(r);
    session.total++;
    if (r.status === 'present') session.present++;
    else if (r.status === 'late') session.late++;
    else session.absent++;
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getAttendanceBadge = (present: number, late: number, total: number) => {
  const pct = total > 0 ? ((present + late) / total) * 100 : 0;
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700';
  if (pct >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const getStatusBadge = (status: string) => {
  if (status === 'present') return 'bg-emerald-100 text-emerald-700';
  if (status === 'late') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

export const Attendance: React.FC = () => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rosterSession, setRosterSession] = useState<Session | null>(null);

  const { data: records = [], isLoading, isError } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceApi.getAll(),
  });

  const sessions = groupIntoSessions(records);

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
    ? Math.round(sessions.reduce((acc, s) => acc + ((s.present + s.late) / (s.total || 1)) * 100, 0) / sessions.length)
    : 0;

  const perfectSessions = sessions.filter((s) => s.absent === 0 && s.late === 0).length;
  const uniqueClassOptions = Array.from(new Map(sessions.map((s) => [s.classId, s.className])).entries());

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Attendance Tracking</h1>
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
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : sessionsThisMonth}</p>
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
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : `${avgRate}%`}</p>
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
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : perfectSessions}</p>
          </div>
        </div>

        <div className="card flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="stat-icon bg-sky-100">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Records</p>
            <p className="text-3xl font-bold text-gray-900 leading-none tabular-nums">{isLoading ? '—' : records.length}</p>
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
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading attendance records...</div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Failed to load attendance. Is the backend running?</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No sessions found</p>
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
                const pct = session.total > 0
                  ? Math.round(((session.present + session.late) / session.total) * 100)
                  : 0;
                return (
                  <tr key={session.key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(session.date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">{session.className}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{session.instructor}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-emerald-700">{session.present}</span>
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
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getAttendanceBadge(session.present, session.late, session.total)}`}>
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
            <p className="text-sm text-gray-500 font-medium">
              {formatDate(rosterSession.date)} · {rosterSession.instructor}
            </p>
            <div className="flex gap-4 text-sm font-semibold">
              <span className="text-emerald-700">Present: {rosterSession.present}</span>
              <span className="text-amber-600">Late: {rosterSession.late}</span>
              <span className="text-red-600">Absent: {rosterSession.absent}</span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {rosterSession.records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.student?.name ?? r.studentId}</p>
                    <p className="text-xs text-gray-400">{r.student?.studentId ?? r.studentId}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize ${getStatusBadge(r.status)}`}>
                    {r.status}
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
    </div>
  );
};
