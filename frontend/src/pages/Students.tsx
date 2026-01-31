import React, { useState } from 'react';
import { Modal } from '../components/common/Modal';

// Mock student data for UI demonstration
const mockStudents = [
  {
    id: '1',
    studentId: 'STU-2024-001',
    firstName: 'Emma',
    lastName: 'Johnson',
    email: 'emma.j@email.com',
    phone: '(555) 123-4567',
    grade: '10th',
    enrolledClasses: 3,
    status: 'Active',
  },
  {
    id: '2',
    studentId: 'STU-2024-002',
    firstName: 'Liam',
    lastName: 'Smith',
    email: 'liam.s@email.com',
    phone: '(555) 234-5678',
    grade: '11th',
    enrolledClasses: 2,
    status: 'Active',
  },
  {
    id: '3',
    studentId: 'STU-2024-003',
    firstName: 'Olivia',
    lastName: 'Williams',
    email: 'olivia.w@email.com',
    phone: '(555) 345-6789',
    grade: '9th',
    enrolledClasses: 4,
    status: 'Active',
  },
  {
    id: '4',
    studentId: 'STU-2024-004',
    firstName: 'Noah',
    lastName: 'Brown',
    email: 'noah.b@email.com',
    phone: '(555) 456-7890',
    grade: '12th',
    enrolledClasses: 1,
    status: 'Inactive',
  },
];

export const Students: React.FC = () => {
  const [students] = useState(mockStudents);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(search.toLowerCase()) ||
      student.lastName.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId.toLowerCase().includes(search.toLowerCase());

    const matchesGrade = !gradeFilter || student.grade === gradeFilter;
    const matchesStatus = !statusFilter || student.status === statusFilter;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  const activeStudents = students.filter((s) => s.status === 'Active').length;
  const totalEnrollments = students.reduce((sum, s) => sum + s.enrolledClasses, 0);

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-jet-black">Student Management</h1>
        <button onClick={handleAddNew} className="btn-primary">
          + Add Student
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-white to-pale-sky/20 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-primary-600 mb-2 uppercase tracking-wide">
            Total Students
          </h3>
          <p className="text-4xl font-bold text-jet-black">{students.length}</p>
        </div>

        <div className="card bg-gradient-to-br from-white to-green-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">
            Active Students
          </h3>
          <p className="text-4xl font-bold text-green-600">{activeStudents}</p>
        </div>

        <div className="card bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
            Total Enrollments
          </h3>
          <p className="text-4xl font-bold text-blue-600">{totalEnrollments}</p>
        </div>

        <div className="card bg-gradient-to-br from-white to-purple-50 hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-semibold text-purple-700 mb-2 uppercase tracking-wide">
            Avg Classes/Student
          </h3>
          <p className="text-4xl font-bold text-purple-600">
            {(totalEnrollments / students.length).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Grade
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Grades</option>
              <option value="9th">9th Grade</option>
              <option value="10th">10th Grade</option>
              <option value="11th">11th Grade</option>
              <option value="12th">12th Grade</option>
            </select>
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
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-x-auto">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-primary-600 text-lg mb-4">No students found</p>
            <button onClick={handleAddNew} className="btn-primary">
              Add your first student
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-pale-sky">
            <thead className="bg-gradient-to-r from-pale-sky/30 to-light-blue/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-jet-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-jet-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-pale-sky/50">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-pale-sky/10 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-700">
                    {student.studentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-jet-black">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                    {student.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-jet-black">
                    {student.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-sm font-bold bg-blue-100 text-blue-700 rounded-full">
                      {student.enrolledClasses}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        student.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Edit
                    </button>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold">
                      View Classes
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        title={selectedStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                First Name *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Emma"
                defaultValue={selectedStudent?.firstName}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Last Name *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Johnson"
                defaultValue={selectedStudent?.lastName}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Email *
            </label>
            <input
              type="email"
              className="input"
              placeholder="student@email.com"
              defaultValue={selectedStudent?.email}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Phone
            </label>
            <input
              type="tel"
              className="input"
              placeholder="(555) 123-4567"
              defaultValue={selectedStudent?.phone}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Grade *
              </label>
              <select className="input" defaultValue={selectedStudent?.grade}>
                <option value="">Select Grade</option>
                <option value="9th">9th Grade</option>
                <option value="10th">10th Grade</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-jet-black mb-2">
                Status *
              </label>
              <select className="input" defaultValue={selectedStudent?.status}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Guardian/Parent Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="parent@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-jet-black mb-2">
              Notes
            </label>
            <textarea
              rows={3}
              className="input"
              placeholder="Additional notes about the student..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-pale-sky">
            <button type="button" className="btn-primary flex-1">
              {selectedStudent ? 'Update Student' : 'Add Student'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedStudent(null);
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
          📝 <strong>Note:</strong> This page is using sample data for UI demonstration.
          The backend integration for student management will be added when you're ready to
          connect it to your database.
        </p>
      </div>
    </div>
  );
};
