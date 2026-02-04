/**
 * Task list view with filters and bulk operations
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, Calendar, List, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { taskService } from '../../services/taskService';
import { TASK_STATUS, TASK_PRIORITY, PRIORITY_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { SkeletonTable } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export default function TaskList() {
  const { user } = useAuth();
  const canCreateDelete = user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const { showToast } = useToast();

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (canCreateDelete === false) {
        const userId = user?._id ?? user?.id;
        if (userId) params.assignedTo = userId;
      }
      const res = await taskService.getAll(params);
      setTasks(res.data?.data ?? []);
    } catch (e) {
      showToast(e.userMessage || 'Failed to load tasks', 'error');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, canCreateDelete, user?._id, user?.id]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => taskService.delete(id)));
      showToast('Tasks deleted', 'success');
      setSelectedIds([]);
      loadTasks();
    } catch (e) {
      showToast(e.userMessage || 'Delete failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await taskService.delete(id);
      showToast('Task deleted', 'success');
      setDeleteModal({ open: false, id: null });
      loadTasks();
    } catch (e) {
      showToast(e.userMessage || 'Delete failed', 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) setSelectedIds([]);
    else setSelectedIds(tasks.map((t) => t._id));
  };

  if (loading) return <SkeletonTable rows={8} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
        <div className="flex items-center gap-2">
          <Link
            to="/tasks/kanban"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </Link>
          <Link
            to="/tasks/calendar"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Calendar className="w-4 h-4" /> Calendar
          </Link>
          {canCreateDelete && (
            <Link
              to="/tasks/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" /> New task
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
        >
          <option value="">All statuses</option>
          <option value={TASK_STATUS.TODO}>To Do</option>
          <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
          <option value={TASK_STATUS.DONE}>Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
        >
          <option value="">All priorities</option>
          <option value={TASK_PRIORITY.HIGH}>High</option>
          <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
          <option value={TASK_PRIORITY.LOW}>Low</option>
        </select>
        {canCreateDelete && selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} task(s)?`)) handleBulkDelete();
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" /> Delete selected
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tasks.length === 0 ? (
          <EmptyState
            icon={List}
            title="No tasks"
            description={canCreateDelete ? 'Create a task or adjust filters.' : 'No tasks assigned yet.'}
            action={canCreateDelete ? (
              <Link to="/tasks/new" className="text-primary-600 hover:underline font-medium">
                Create task
              </Link>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {canCreateDelete && (
                    <th className="text-left py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={tasks.length > 0 && selectedIds.length === tasks.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Due date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Progress</th>
                  {canCreateDelete && <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    {canCreateDelete && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(t._id)}
                          onChange={() => toggleSelect(t._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <Link to={`/tasks/${t._id}`} className="font-medium text-primary-600 hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{t.status ?? '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.Medium}`}>
                        {t.priority ?? 'medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{t.deadline ? formatDate(t.deadline) : '-'}</td>
                    <td className="py-3 px-4">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${t.progressPercent ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{t.progressPercent ?? 0}%</span>
                    </td>
                    {canCreateDelete && (
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, id: t._id })}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteModal.id && handleDelete(deleteModal.id)}
        title="Delete task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
