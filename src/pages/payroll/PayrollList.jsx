/**
 * Salary slip list with filters, YTD summary and download.
 * Employees: see their own slips.
 * Admin/Manager: can filter by employee and generate slips.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, FileText, PlusCircle } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { SkeletonTable, Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const MONTHS = [
  { value: '', label: 'All months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function PayrollList() {
  const { user, isAdmin, isManager } = useAuth();
  const isPrivileged = isAdmin || isManager;
  const { showToast } = useToast();

  const [slips, setSlips] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [page, setPage] = useState(1);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [ytd, setYtd] = useState(null);
  const [loadingYtd, setLoadingYtd] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  const initialForm = {
    employeeId: '',
    month: '',
    year: currentYear,
    basicSalary: '',
    allowances: [{ name: 'HRA', amount: '' }],
    deductions: [{ name: 'PF', amount: '' }],
  };
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => pagination?.pages ?? 1, [pagination]);

  // Load employees for admin/manager filter and generate modal
  useEffect(() => {
    if (!isPrivileged) return;
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        // Use the same API shape as EmployeeDirectory so we get
        // the full, server-side-filtered employee list.
        const res = await employeeService.getAll({});
        setEmployees(res.data?.data ?? res.data ?? []);
      } catch (e) {
        showToast(e.userMessage || 'Failed to load employees', 'error');
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    loadEmployees();
  }, [isPrivileged, showToast]);

  // Load salary slips
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { year, page, limit: 10 };
        if (month) params.month = month;
        if (isPrivileged && employeeId) {
          params.employee = employeeId;
        }
        const res = await payrollService.getAll(params);
        setSlips(res.data?.data ?? []);
        setPagination(res.data?.pagination ?? null);
      } catch (e) {
        showToast(e.userMessage || 'Failed to load salary slips', 'error');
        setSlips([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month, employeeId, page, isPrivileged, showToast]);

  // Load YTD summary (current user or selected employee)
  useEffect(() => {
    const loadYtd = async () => {
      setLoadingYtd(true);
      try {
        let res;
        if (isPrivileged && employeeId) {
          res = await payrollService.getYtdForEmployee(employeeId, year);
        } else {
          res = await payrollService.getYtd(year);
        }
        setYtd(res.data?.data ?? res.data);
      } catch {
        setYtd(null);
      } finally {
        setLoadingYtd(false);
      }
    };
    loadYtd();
  }, [year, employeeId, isPrivileged]);

  // Same download behavior as the detail page (works for manager/employee),
  // re-used here so admin list downloads behave identically.
  const handleDownload = async (id) => {
    try {
      const res = await payrollService.download(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-slip-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Download started', 'success');
    } catch (e) {
      showToast(e.userMessage || 'Download failed', 'error');
    }
  };

  const resetPagination = () => setPage(1);

  const handleChangeAllowance = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.allowances];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, allowances: next };
    });
  };

  const handleChangeDeduction = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.deductions];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, deductions: next };
    });
  };

  const addRow = (field) => {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], { name: '', amount: '' }],
    }));
  };

  const removeRow = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.month || !form.year || !form.basicSalary) {
      showToast('Employee, month, year and basic salary are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const allowancesObj = {};
      form.allowances
        .filter((a) => a.name && a.amount)
        .forEach((a) => {
          allowancesObj[a.name] = Number(a.amount) || 0;
        });

      const deductionsObj = {};
      form.deductions
        .filter((d) => d.name && d.amount)
        .forEach((d) => {
          deductionsObj[d.name] = Number(d.amount) || 0;
        });

      const payload = {
        employeeId: form.employeeId,
        month: Number(form.month),
        year: Number(form.year),
        basicSalary: Number(form.basicSalary),
        allowances: allowancesObj,
        deductions: deductionsObj,
      };

      await payrollService.generate(payload);
      showToast('Salary slip generated', 'success');
      setShowGenerate(false);
      setForm(initialForm);
      // Reload list & YTD for the same filters
      setPage(1);
    } catch (e) {
      showToast(e.userMessage || 'Failed to generate salary slip', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonTable rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payroll</h2>
          {user?.name && (
            <p className="text-xs text-gray-500">
              Viewing salary slips {isPrivileged && employeeId ? 'for selected employee' : 'for your account'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                resetPagination();
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <select
            value={month}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : '';
              setMonth(value);
              resetPagination();
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          >
            {MONTHS.map((m) => (
              <option key={m.label} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {isPrivileged && (
            <select
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                resetPagination();
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 min-w-[180px]"
            >
              <option value="">All employees (role-limited server-side)</option>
              {loadingEmployees ? (
                <option disabled>Loading employees…</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name || emp.email}
                  </option>
                ))
              )}
            </select>
          )}
          {isPrivileged && (
            <button
              type="button"
              onClick={() => setShowGenerate(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <PlusCircle className="w-4 h-4" />
              Generate slip
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Link
          to="/payroll/attendance"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">Attendance & Clock-in</span>
        </Link>
        <Link
          to="/payroll/reimbursements"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <span className="font-medium text-gray-900">Reimbursements</span>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Year-to-date summary</h3>
          {loadingYtd ? (
            <Skeleton className="h-12 rounded-lg" />
          ) : !ytd ? (
            <p className="text-xs text-gray-500">No YTD data for selected filters.</p>
          ) : (
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {ytd.totalGross != null && (
                <>
                  <dt className="text-gray-500">Total gross</dt>
                  <dd className="font-medium text-gray-900">{formatCurrency(ytd.totalGross)}</dd>
                </>
              )}
              {ytd.totalDeductions != null && (
                <>
                  <dt className="text-gray-500">Total deductions</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(ytd.totalDeductions)}
                  </dd>
                </>
              )}
              {ytd.totalNet != null && (
                <>
                  <dt className="text-gray-500">Total net</dt>
                  <dd className="font-medium text-gray-900">{formatCurrency(ytd.totalNet)}</dd>
                </>
              )}
            </dl>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-900 p-4 border-b border-gray-200">
          Salary slips
        </h3>
        {slips.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No salary slips"
            description="Slips will appear here once generated."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Month</th>
                    {isPrivileged && (
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Employee
                      </th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Gross</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deductions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Net</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slips.map((s) => {
                    const totalDeductions =
                      typeof s.deductions === 'object'
                        ? Object.values(s.deductions || {}).reduce(
                            (a, b) => a + (Number(b) || 0),
                            0
                          )
                        : s.deductions;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {s.month != null
                            ? `${s.year}-${String(s.month).padStart(2, '0')}`
                            : '-'}
                        </td>
                        {isPrivileged && (
                          <td className="py-3 px-4 text-gray-600">
                            {s.employee?.name ?? s.employee?.email ?? '-'}
                          </td>
                        )}
                        <td className="py-3 px-4 text-gray-600">
                          {formatCurrency(s.grossSalary)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatCurrency(totalDeductions)}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {formatCurrency(s.netSalary)}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <Link
                            to={`/payroll/slip/${s._id}`}
                            className="text-primary-600 hover:underline"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDownload(s._id)}
                            className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-xs text-gray-600">
                <span>
                  Page {pagination?.page ?? 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isPrivileged && showGenerate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Generate salary slip</h3>
              <button
                type="button"
                onClick={() => {
                  setShowGenerate(false);
                  setForm(initialForm);
                }}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={form.employeeId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, employeeId: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name || emp.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    value={form.month}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, month: Number(e.target.value) || '' }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select month</option>
                    {MONTHS.filter((m) => m.value).map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, year: Number(e.target.value) || '' }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic salary
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.basicSalary}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, basicSalary: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Allowances</h4>
                    <button
                      type="button"
                      onClick={() => addRow('allowances')}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.allowances.map((a, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          placeholder="Label"
                          value={a.name}
                          onChange={(e) =>
                            handleChangeAllowance(idx, 'name', e.target.value)
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Amount"
                          value={a.amount}
                          onChange={(e) =>
                            handleChangeAllowance(idx, 'amount', e.target.value)
                          }
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        />
                        {form.allowances.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow('allowances', idx)}
                            className="text-xs text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Deductions</h4>
                    <button
                      type="button"
                      onClick={() => addRow('deductions')}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.deductions.map((d, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          placeholder="Label"
                          value={d.name}
                          onChange={(e) =>
                            handleChangeDeduction(idx, 'name', e.target.value)
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Amount"
                          value={d.amount}
                          onChange={(e) =>
                            handleChangeDeduction(idx, 'amount', e.target.value)
                          }
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        />
                        {form.deductions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow('deductions', idx)}
                            className="text-xs text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowGenerate(false);
                  setForm(initialForm);
                }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Generating…' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
