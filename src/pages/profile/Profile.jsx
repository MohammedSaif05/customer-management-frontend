/**
 * Current user profile: view/edit, documents, photo, profile completion
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatDate } from '../../utils/helpers';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { Edit2, Save, FileText, Upload, User } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const userId = user?._id ?? user?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [empRes, profileRes] = await Promise.all([
          userService.getById(userId),
          userService.getProfile(userId).catch(() => ({ data: {} })),
        ]);
        const userData = empRes.data?.data ?? empRes.data;
        const profileData = profileRes.data?.data ?? profileRes.data;
        setProfile({ ...userData, ...profileData?.user, ...profileData });
        setDocuments(profileData?.documents ?? []);
      } catch (e) {
        setProfile(user);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleSave = async () => {
    if (!profile || !userId) return;
    setSaving(true);
    try {
      await userService.updateProfile(userId, profile);
      setEditing(false);
      showToast('Profile updated', 'success');
    } catch (e) {
      showToast(e.userMessage || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fields = ['name', 'email', 'phone', 'department', 'designation', 'dateOfJoin', 'address', 'skills'];
  const filled = fields.filter((f) => profile?.[f] != null && profile[f] !== '').length;
  const completionPercent = profile?.profileCompletionPercent ?? (profile ? Math.round((filled / fields.length) * 100) : 0);

  if (loading) return <Skeleton className="h-96 rounded-xl" />;
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">My profile</h2>

      {/* Profile completion */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Profile completion</span>
          <span className="text-sm font-medium text-primary-600">{completionPercent}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-2xl">
              {profile.photo ? (
                <img src={profile.photo} alt="" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            {editing && (
              <p className="mt-2 text-xs text-gray-500">Photo update via HR/Admin</p>
            )}
          </div>
          <div className="flex-1 space-y-4">
            {editing ? (
              <>
                {['name', 'email', 'phone', 'department', 'designation', 'address'].map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</label>
                    <input
                      type={key === 'email' ? 'email' : 'text'}
                      value={profile[key] ?? ''}
                      onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills / Qualifications</label>
                  <textarea
                    value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills ?? ''}
                    onChange={(e) => setProfile((p) => ({ ...p, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Comma-separated"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{profile.name ?? 'Unknown'}</h3>
                  <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{profile.email ?? '-'}</dd>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{profile.phone ?? '-'}</dd>
                  <dt className="text-gray-500">Department</dt>
                  <dd className="text-gray-900">{profile.department ?? '-'}</dd>
                  <dt className="text-gray-500">Designation</dt>
                  <dd className="text-gray-900">{profile.designation ?? profile.role ?? '-'}</dd>
                  <dt className="text-gray-500">Date of join</dt>
                  <dd className="text-gray-900">{profile.dateOfJoin ? formatDate(profile.dateOfJoin) : '-'}</dd>
                  <dt className="text-gray-500">Address</dt>
                  <dd className="text-gray-900">{profile.address ?? '-'}</dd>
                  {profile.skills?.length > 0 && (
                    <>
                      <dt className="text-gray-500">Skills</dt>
                      <dd className="text-gray-900">{Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}</dd>
                    </>
                  )}
                </dl>
              </>
            )}
          </div>
        </div>
        {editing && (
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> My documents
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
    </div>
  );
}
