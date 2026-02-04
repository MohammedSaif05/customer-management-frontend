/**
 * Leave approvals (Admin/Manager)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowLeft, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { leaveService } from '../../services/leaveService';
import { formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export default function LeaveApprovals() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const { showToast } = useToast();

  const isManager = user?.role === ROLES.MANAGER;
  const currentUserId = user?._id ?? user?.id;
  const displayLeaves = isManager
    ? leaves.filter((l) => (l.employee?._id ?? l.employee?.id ?? l.userId ?? l.employeeId) !== currentUserId)
    : leaves;

  const load = async () => {
    setLoading(true);
    try {
      const res = await leaveService.getAll({ status: 'Pending' });
      setLeaves(res.data?.data ?? []);
    } catch (e) {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await leaveService.approve(id, { action: 'approve' });
      showToast('Leave approved', 'success');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    setActionId(id);
    try {
      await leaveService.reject(id, reason || undefined);
      showToast('Leave rejected', 'success');
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to reject', 'error');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <SkeletonTable rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Leave approvals</h2>
        <Link to="/leave/team" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Team calendar
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {displayLeaves.length === 0 ? (
          <EmptyState icon={Calendar} title="No pending leave requests" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Start – End</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{l.employee?.name ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{l.leaveType ?? 'Leave'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(l.fromDate)} – {formatDate(l.toDate)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{l.reason ?? '-'}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        type="button"
                        disabled={actionId === l._id}
                        onClick={() => handleApprove(l._id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={actionId === l._id}
                        onClick={() => handleReject(l._id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
