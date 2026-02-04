/**
 * Searchable employee list, card-based profiles, filters, org chart link
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Grid, List, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { employeeService } from '../../services/employeeService';
import { getInitials } from '../../utils/helpers';
import { SkeletonCard } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export default function EmployeeDirectory() {
  const { user } = useAuth();
  const isManager = user?.role === ROLES.MANAGER;
  const isAdmin = user?.role === ROLES.ADMIN;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [view, setView] = useState('card'); // card | list

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (departmentFilter) params.department = departmentFilter;
        if (roleFilter) params.role = roleFilter;
        const res = await employeeService.getAll(params);
        setEmployees(res.data?.data ?? []);
      } catch (e) {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, departmentFilter, roleFilter]);

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const roles = [...new Set(employees.map((e) => e.role).filter(Boolean))];

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Department', 'Role'];
    const rows = employees.map((e) => [e.name, e.email, e.department ?? '', e.role ?? '']);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const pageTitle = isManager ? 'Team' : 'Employee directory';
  const pageSubtitle = isManager ? 'View and manage your team members' : 'Search and manage all employees';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{pageTitle}</h2>
          <p className="text-sm text-gray-600 mt-0.5">{pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/employees/new"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              + New employee
            </Link>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setView('card')}
              className={`p-2 ${view === 'card' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              aria-label="Card view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState icon={Users} title="No employees found" description="Try adjusting filters or search." />
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <Link
              key={emp._id}
              to={`/employees/${emp._id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {emp.photo ? (
                    <img src={emp.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    getInitials(emp.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{emp.name ?? 'Unknown'}</p>
                  <p className="text-sm text-gray-500 truncate">{emp.email ?? '-'}</p>
                  {(emp.department || emp.role) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[emp.department, emp.role].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link to={`/employees/${emp._id}`} className="font-medium text-primary-600 hover:underline">
                        {emp.name ?? 'Unknown'}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{emp.email ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{emp.department ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{emp.role ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
