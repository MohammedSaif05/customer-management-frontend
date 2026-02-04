/**
 * Leave history with status
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { leaveService } from '../../services/leaveService';
import { formatDate } from '../../utils/helpers';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export default function LeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await leaveService.getAll({});
        setLeaves(res.data?.data ?? []);
      } catch (e) {
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusClass = (s) => (s === 'Approved' ? 'bg-green-100 text-green-800' : s === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800');

  if (loading) return <SkeletonTable rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Leave history</h2>
        <Link to="/leave" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Apply leave
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {leaves.length === 0 ? (
          <EmptyState icon={Calendar} title="No leave records" description="Apply leave from the leave page." action={<Link to="/leave" className="text-primary-600 hover:underline font-medium">Apply leave</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Start</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">End</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Days</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{l.leaveType ?? 'Leave'}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(l.fromDate)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(l.toDate)}</td>
                    <td className="py-3 px-4 text-gray-600">{l.days ?? '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusClass(l.status)}`}>{l.status}</span>
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
