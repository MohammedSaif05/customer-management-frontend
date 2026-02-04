/**
 * Reimbursements – API: POST/GET /api/reimbursements { amount, description }
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, ArrowLeft } from 'lucide-react';
import { reimbursementService } from '../../services/reimbursementService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function Reimbursements() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '' });
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await reimbursementService.getAll({});
      setList(res.data?.data ?? []);
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await reimbursementService.create({ amount: Number(form.amount), description: form.description });
      showToast('Reimbursement submitted', 'success');
      setModalOpen(false);
      setForm({ amount: '', description: '' });
      load();
    } catch (e) {
      showToast(e.userMessage || 'Submission failed', 'error');
    }
  };

  const statusColor = (s) => (s === 'Approved' || s === 'Paid' ? 'bg-green-100 text-green-800' : s === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800');

  if (loading) return <SkeletonTable rows={5} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Reimbursements</h2>
        <div className="flex items-center gap-2">
          <Link to="/payroll" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Payroll
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> Submit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={FileText} title="No reimbursements" description="Submit a reimbursement request." action={
            <button type="button" onClick={() => setModalOpen(true)} className="text-primary-600 hover:underline font-medium">Submit request</button>
          } />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(r.createdAt)}</td>
                    <td className="py-3 px-4">{r.description ?? '-'}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(r.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor(r.status)}`}>{r.status ?? 'Pending'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Transition show={modalOpen} as={Fragment}>
        <Dialog onClose={() => setModalOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-lg font-semibold text-gray-900">Submit reimbursement</Dialog.Title>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Travel expense" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">Submit</button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
