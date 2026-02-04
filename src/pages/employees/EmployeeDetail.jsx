/**
 * Employee profile: view/edit (role-based), documents, employment history
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Building2, Briefcase, FileText, Edit2, Save, Trash2, Lock, Send } from 'lucide-react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';
import { ROLES } from '../../utils/constants';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, canAccessAdmin } = useAuth();
  const isNew = id === 'new';
  const [employee, setEmployee] = useState(null);
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const { showToast } = useToast();
  const isOwnProfile = !isNew && (currentUser?._id === id || currentUser?.id === id);

  useEffect(() => {
    // For "new" employee, initialize empty form (Admin only)
    if (isNew) {
      if (!canAccessAdmin) {
        navigate('/unauthorized', { replace: true });
        return;
      }
      setEmployee({
        name: '',
        email: '',
        password: '',
        sendEmail: true,
        department: '',
        designation: '',
        role: ROLES.EMPLOYEE,
        isActive: true,
      });
      setEmploymentHistory([]);
      setDocuments([]);
      setLoading(false);
      setEditing(true);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [empRes, profileRes] = await Promise.all([
          userService.getById(id),
          userService.getProfile(id).catch(() => ({ data: {} })),
        ]);
        setEmployee(empRes.data?.data ?? empRes.data);
        const profile = profileRes.data?.data ?? profileRes.data;
        setEmploymentHistory(profile?.qualifications ?? []);
        setDocuments(profile?.documents ?? []);
      } catch (e) {
        showToast(e.response?.data?.message || 'Employee not found', 'error');
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew, canAccessAdmin, navigate]);

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      if (isNew) {
        const payload = {
          name: employee.name,
          email: employee.email,
          department: employee.department,
          designation: employee.designation,
          role: employee.role || ROLES.EMPLOYEE,
          sendEmail: !!employee.sendEmail,
        };
        if (employee.password?.trim()) payload.password = employee.password.trim();
        await userService.create(payload);
        showToast('Employee created', 'success');
        const role = String(currentUser?.role || '').toUpperCase();
        if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
          navigate('/dashboard/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        await userService.update(id, employee);
        setEmployee((prev) => ({ ...prev, ...employee }));
        setEditing(false);
        showToast('Profile updated', 'success');
      }
    } catch (e) {
      showToast(e.userMessage || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!employee || !canAccessAdmin || isNew) return;
    try {
      await userService.deactivate(id);
      showToast('Employee deactivated', 'success');
      setDeactivateModal(false);
      navigate('/employees', { replace: true });
    } catch (e) {
      showToast(e.userMessage || 'Failed to deactivate', 'error');
    }
  };

  const canEdit = isNew ? canAccessAdmin : isOwnProfile || canAccessAdmin;

  if (loading) return <Skeleton className="h-96 rounded-xl" />;
  if (!employee) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/employees" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </Link>
        <div className="flex items-center gap-2">
          {canAccessAdmin && !isNew && (
            <button
              type="button"
              onClick={() => setDeactivateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Deactivate
            </button>
          )}
          {canEdit && (
            editing ? (
              <div className="flex gap-2">
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-2xl">
              {employee.photo ? (
                <img src={employee.photo} alt="" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                getInitials(employee.name)
              )}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={employee.name ?? ''} onChange={(e) => setEmployee((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={employee.email ?? ''} onChange={(e) => setEmployee((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={employee.department ?? ''} onChange={(e) => setEmployee((p) => ({ ...p, department: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" value={employee.designation ?? employee.role ?? ''} onChange={(e) => setEmployee((p) => ({ ...p, designation: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                {isNew && (
                  <>
                    <div className="border-t border-gray-200 pt-4 mt-2">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Login credentials
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial password</label>
                        <input
                          type="text"
                          value={employee.password ?? ''}
                          onChange={(e) => setEmployee((p) => ({ ...p, password: e.target.value }))}
                          placeholder="Leave blank to auto-generate and send by email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          autoComplete="new-password"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank to let the system generate a secure password and email it to the employee.</p>
                      </div>
                      <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!employee.sendEmail}
                          onChange={(e) => setEmployee((p) => ({ ...p, sendEmail: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm flex items-center gap-1">
                          <Send className="w-4 h-4" /> Send welcome email with login credentials
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Employee will receive their login link or temporary password by email. They can use Forgot password if needed.</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900">{employee.name ?? 'Unknown'}</h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{employee.email ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{employee.department ?? '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{employee.designation ?? employee.role ?? '-'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documents
          </h3>
          <ul className="space-y-2">
            {documents.map((d) => (
              <li key={d._id}>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                  {d.name ?? d.filename ?? 'Document'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canAccessAdmin && employmentHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Employment history</h3>
          <ul className="space-y-2 text-sm">
            {employmentHistory.map((h, i) => (
              <li key={h._id || i} className="flex justify-between items-start">
                <span className="text-gray-900">{h.degree ?? h.institution ?? h.title ?? '-'}</span>
                <span className="text-gray-500">{h.year ?? '-'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        open={deactivateModal}
        onClose={() => setDeactivateModal(false)}
        onConfirm={handleDeactivate}
        title="Deactivate employee"
        message="Are you sure you want to deactivate this employee? They will no longer be able to log in."
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
}
