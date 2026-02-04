import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Megaphone, Pin, Plus, Pencil, Trash2, X } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';
import ConfirmModal from '../common/ConfirmModal';
import { announcementService } from '../../services/announcementService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/helpers';

const DEFAULT_VISIBLE_TO = ['ALL'];

function toDateInputValue(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function toIsoOrNull(dateInputValue) {
  if (!dateInputValue) return null;
  // Interpret as local date (00:00 local) and send ISO; backend treats it as a timestamp.
  const d = new Date(`${dateInputValue}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AnnouncementsCard({
  title = 'Company announcements',
  limit = 5,
  showPinnedFirst = true,
  expired = false,
}) {
  const { canAccessManager } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    isPinned: false,
    expiresAt: '',
  });

  const canManage = !!canAccessManager;

  const load = async (page = 1) => {
    setLoading(true);
    try {
      if (showPinnedFirst) {
        const [pinnedRes, normalRes] = await Promise.allSettled([
          announcementService.list({
            page,
            limit,
            pinned: true,
            expired,
          }),
          announcementService.list({
            page,
            limit,
            pinned: false,
            expired,
          }),
        ]);
        const pinned = pinnedRes.status === 'fulfilled' ? pinnedRes.value?.data?.data ?? [] : [];
        const normal = normalRes.status === 'fulfilled' ? normalRes.value?.data?.data ?? [] : [];

        const seen = new Set();
        const merged = [];
        [...pinned, ...normal].forEach((a) => {
          if (!a?._id || seen.has(a._id)) return;
          seen.add(a._id);
          merged.push(a);
        });
        setItems(merged);

        const pinnedPg = pinnedRes.status === 'fulfilled' ? pinnedRes.value?.data?.pagination : null;
        const normalPg = normalRes.status === 'fulfilled' ? normalRes.value?.data?.pagination : null;
        setPageInfo(pinnedPg || normalPg || null);
      } else {
        const res = await announcementService.list({ page, limit, expired });
        setItems(res.data?.data ?? []);
        setPageInfo(res.data?.pagination ?? null);
      }
    } catch (e) {
      showToast(e?.userMessage || 'Failed to load announcements', 'error');
      setItems([]);
      setPageInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, showPinnedFirst, expired]);

  const hasMore = useMemo(() => {
    if (!pageInfo) return false;
    const page = pageInfo.page ?? 1;
    const pages = pageInfo.pages ?? 1;
    return page < pages;
  }, [pageInfo]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', message: '', isPinned: false, expiresAt: '' });
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a?.title ?? '',
      message: a?.message ?? '',
      isPinned: !!a?.isPinned,
      expiresAt: toDateInputValue(a?.expiresAt),
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message?.trim() || '',
        visibleTo: DEFAULT_VISIBLE_TO,
        isPinned: !!form.isPinned,
        expiresAt: toIsoOrNull(form.expiresAt),
      };

      if (editing?._id) {
        await announcementService.update(editing._id, payload);
        showToast('Announcement updated', 'success');
      } else {
        await announcementService.create(payload);
        showToast('Announcement created', 'success');
      }
      setModalOpen(false);
      await load(pageInfo?.page ?? 1);
    } catch (err) {
      showToast(err?.userMessage || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (a) => {
    setToDelete(a);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete?._id) return;
    setDeleting(true);
    try {
      await announcementService.remove(toDelete._id);
      showToast('Announcement deleted', 'success');
      setToDelete(null);
      await load(pageInfo?.page ?? 1);
    } catch (e) {
      showToast(e?.userMessage || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary-600" /> {title}
        </h3>

        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a._id}
              className="p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {a.isPinned && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <p className="font-medium text-gray-900 truncate">{a.title}</p>
                  </div>
                  {a.message && (
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                    {a.createdAt && <span>{formatDate(a.createdAt)}</span>}
                    {a.createdBy?.name && <span>By {a.createdBy.name}</span>}
                    {a.expiresAt && <span>Expires {formatDate(a.expiresAt)}</span>}
                  </div>
                </div>

                {canManage && (
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(a)}
                      className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
                      title="Delete"
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => load((pageInfo?.page ?? 1) + 1)}
            className="w-full px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 border border-primary-100"
          >
            Load more
          </button>
        </div>
      )}

      <Transition show={modalOpen} as={Fragment}>
        <Dialog onClose={() => setModalOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
              <div className="flex items-start justify-between gap-3">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {editing ? 'Edit announcement' : 'New announcement'}
                </Dialog.Title>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. System Update"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Write the announcement..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires on (optional)
                    </label>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to never expire.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-7">
                    <input
                      id="isPinned"
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={(e) => setForm((p) => ({ ...p, isPinned: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isPinned" className="text-sm font-medium text-gray-700">
                      Pin this announcement
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
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
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete announcement?"
        message="This action cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}

