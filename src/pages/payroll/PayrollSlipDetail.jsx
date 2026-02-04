/**
 * Salary slip preview and download
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';

export default function PayrollSlipDetail() {
  const { id } = useParams();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await payrollService.getById(id);
        setSlip(res.data?.data ?? res.data);
      } catch (e) {
        showToast(e.userMessage || 'Slip not found', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownload = async () => {
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

  if (loading) return <Skeleton className="h-96 rounded-xl" />;
  if (!slip) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/payroll" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to payroll
        </Link>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Salary slip</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Month / Year</span>
          <span className="font-medium">{slip.month != null ? `${slip.year}-${String(slip.month).padStart(2, '0')}` : '-'}</span>
          <span className="text-gray-500">Employee</span>
          <span className="font-medium">{slip.employee?.name ?? '-'}</span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Earnings</h3>
          <ul className="space-y-1">
            {slip.basicSalary != null && (
              <li className="flex justify-between text-sm">
                <span className="text-gray-600">Basic</span>
                <span>{formatCurrency(slip.basicSalary)}</span>
              </li>
            )}
            {slip.allowances && typeof slip.allowances === 'object' && Object.entries(slip.allowances).map(([k, v]) => (
              <li key={k} className="flex justify-between text-sm">
                <span className="text-gray-600">{k}</span>
                <span>{formatCurrency(v)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Deductions</h3>
          <ul className="space-y-1">
            {slip.deductions && typeof slip.deductions === 'object' && Object.entries(slip.deductions).map(([k, v]) => (
              <li key={k} className="flex justify-between text-sm">
                <span className="text-gray-600">{k}</span>
                <span>{formatCurrency(v)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
          <span>Net salary</span>
          <span>{formatCurrency(slip.netSalary)}</span>
        </div>
      </div>
    </div>
  );
}
