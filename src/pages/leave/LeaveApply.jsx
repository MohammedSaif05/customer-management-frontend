/**
 * Apply leave – API: POST /api/leaves { leaveType, fromDate, toDate, reason }, GET /api/leaves/balance
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { leaveService } from '../../services/leaveService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/helpers';
import { Skeleton } from '../../components/common/Skeleton';

const LEAVE_TYPES = ['Sick', 'Casual', 'Earned', 'Maternity', 'Paternity', 'Unpaid', 'Other'];

export default function LeaveApply() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'Casual',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canAccessTeam = user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await leaveService.getBalance();
        setBalance(res.data?.data ?? res.data);
      } catch (e) {
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await leaveService.apply(form);
      showToast('Leave application submitted', 'success');
      setForm({ leaveType: 'Casual', fromDate: '', toDate: '', reason: '' });
      const res = await leaveService.getBalance();
      setBalance(res.data?.data ?? res.data);
      const role = String(user?.role || '').toUpperCase();
      if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (e) {
      showToast(e.userMessage || 'Application failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const casualRemaining = balance?.casualRemaining ?? balance?.available ?? '-';
  const earnedRemaining = balance?.earnedRemaining ?? '-';
  const totalDaysUsed = balance?.totalDaysUsed ?? balance?.used ?? '-';
  const conflictWarning = form.fromDate && form.toDate && (balance?.casualRemaining === 0 && balance?.earnedRemaining === 0);

  if (loading) return <Skeleton className="h-80 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Apply leave</h2>
        <Link to="/leave/history" className="text-sm text-primary-600 hover:underline">Leave history</Link>
        {canAccessTeam && (
          <Link to="/leave/team" className="text-sm text-primary-600 hover:underline">Team calendar</Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Leave balance
        </h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-sm text-gray-500">Casual remaining</span>
            <p className="text-2xl font-semibold text-gray-900">{casualRemaining}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Earned remaining</span>
            <p className="text-2xl font-semibold text-gray-900">{earnedRemaining}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Total days used</span>
            <p className="text-2xl font-semibold text-gray-600">{totalDaysUsed}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">New leave request</h3>
        {conflictWarning && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Leave balance may be low. Please check before submitting.</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave type</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm((p) => ({ ...p, leaveType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
              <input
                type="date"
                value={form.fromDate}
                onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
              <input
                type="date"
                value={form.toDate}
                onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))}
                required
                min={form.fromDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Brief reason for leave"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit leave request'}
          </button>
        </form>
      </div>
    </div>
  );
}
