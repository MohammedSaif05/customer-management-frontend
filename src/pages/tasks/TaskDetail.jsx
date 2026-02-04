/**
 * Task detail: view/edit, comments, attachments, progress
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Paperclip, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { PRIORITY_COLORS, TASK_STATUS, TASK_PRIORITY } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Skeleton } from '../../components/common/Skeleton';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateDelete = user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER;
  const isEmployee = String(user?.role || '').toUpperCase() === ROLES.EMPLOYEE;
  const [task, setTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const { showToast } = useToast();
  const isNew = id === 'new';

  // Employees cannot create new tasks
  useEffect(() => {
    if (isNew && !canCreateDelete) {
      navigate('/unauthorized', { replace: true });
    }
  }, [isNew, canCreateDelete, navigate]);

  useEffect(() => {
    if (isNew) {
      setTask({
        title: '',
        description: '',
        status: TASK_STATUS.TODO,
        priority: TASK_PRIORITY.MEDIUM,
        progressPercent: 0,
        assignedTo: null,
        assignToAll: false,
      });
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const taskRes = await taskService.getById(id);
        const taskData = taskRes.data?.data ?? taskRes.data;
        setTask(taskData);
        setComments(taskData?.comments ?? []);
      } catch (e) {
        showToast(e.userMessage || 'Task not found', 'error');
        setTask(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew, showToast]);

  // Load only EMPLOYEE users for "Assign to" dropdown (exclude Admin, Manager/HR)
  useEffect(() => {
    if (!canCreateDelete) return;
    setEmployeesLoading(true);
    userService
      .getAll({ limit: 100 })
      .then((res) => {
        const list = res.data?.data ?? [];
        const onlyEmployees = (Array.isArray(list) ? list : []).filter(
          (u) => String(u.role || '').toUpperCase() === ROLES.EMPLOYEE
        );
        setEmployees(onlyEmployees);
      })
      .catch(() => setEmployees([]))
      .finally(() => setEmployeesLoading(false));
  }, [canCreateDelete]);

  const userId = user?._id ?? user?.id;
  const taskAssigneeId =
    (task &&
      (typeof task.assignedTo === 'object'
        ? task.assignedTo?._id
        : task.assignedTo)) ||
    null;
  const isAssigneeEmployee =
    !isNew && isEmployee && userId && taskAssigneeId && String(userId) === String(taskAssigneeId);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      if (isNew) {
        const assignee = task.assignToAll ? null : (task.assignedTo || null);
        const payload = {
          title: task.title,
          description: task.description,
          priority: task.priority,
          deadline: task.deadline,
          assignedTo: assignee,
          assignToAll: task.assignToAll || false,
          project: task.project,
        };
        await taskService.create(payload);
        showToast('Task created', 'success');
        const role = String(user?.role || '').toUpperCase();
        if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
          navigate('/dashboard/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        const payload = { title: task.title, description: task.description, status: task.status, priority: task.priority, deadline: task.deadline, progressPercent: task.progressPercent };
        await taskService.update(id, payload);
        setTask((prev) => ({ ...prev, ...task }));
        showToast('Task updated', 'success');
        const role = String(user?.role || '').toUpperCase();
        if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
          navigate('/dashboard/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (e) {
      showToast(e.userMessage || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await taskService.delete(id);
      showToast('Task deleted', 'success');
      navigate('/tasks', { replace: true });
    } catch (e) {
      showToast(e.userMessage || 'Delete failed', 'error');
    } finally {
      setDeleteModal(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!task) return;
    try {
      setSaving(true);
      const payload = { status: TASK_STATUS.DONE, progressPercent: 100 };
      await taskService.update(id, payload);
      setTask((prev) => ({ ...(prev || {}), ...payload }));
      showToast('Task marked as completed – HR/Admin will review.', 'success');
    } catch (e) {
      showToast(e.userMessage || 'Failed to mark task as completed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isNew) return;
    try {
      const res = await taskService.addComment(id, newComment.trim());
      const list = res.data?.data;
      const newComments = Array.isArray(list) ? list : list ? [list] : [];
      setComments((prev) => [...prev, ...newComments]);
      setNewComment('');
      showToast('Comment added', 'success');
    } catch (e) {
      showToast(e.userMessage || 'Failed to add comment', 'error');
    }
  };

  if (loading || !task) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/tasks" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900 flex-1">
          {isNew ? 'New task' : task.title}
        </h2>
        {(canCreateDelete || !isNew) && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        )}
        {!isNew && canCreateDelete && (
          <button
            type="button"
            onClick={() => setDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={task.title ?? ''}
              onChange={(e) => setTask((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={task.status ?? TASK_STATUS.TODO}
              onChange={(e) => setTask((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={TASK_STATUS.TODO}>To Do</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={TASK_STATUS.DONE}>Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={task.priority ?? TASK_PRIORITY.MEDIUM}
              onChange={(e) => setTask((p) => ({ ...p, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={TASK_PRIORITY.HIGH}>High</option>
              <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
              <option value={TASK_PRIORITY.LOW}>Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input
              type="datetime-local"
              value={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''}
              onChange={(e) => setTask((p) => ({ ...p, deadline: e.target.value ? new Date(e.target.value).toISOString() : null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {isNew && canCreateDelete && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    checked={task.assignToAll === true}
                    onChange={() => setTask((p) => ({ ...p, assignToAll: true, assignedTo: null }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">All employees</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignType"
                    checked={task.assignToAll !== true}
                    onChange={() => setTask((p) => ({ ...p, assignToAll: false }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Single employee</span>
                </label>
                {task.assignToAll !== true && (
                  <select
                    value={task.assignedTo ?? ''}
                    onChange={(e) => setTask((p) => ({ ...p, assignedTo: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mt-1"
                    disabled={employeesLoading}
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name ?? emp.email ?? 'Unknown'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Progress %</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={task.progressPercent ?? 0}
                onChange={(e) => setTask((p) => ({ ...p, progressPercent: Number(e.target.value) }))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-10">{task.progressPercent ?? 0}%</span>
            </div>
            {isAssigneeEmployee && task.status !== TASK_STATUS.DONE && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Marking...' : 'Mark as completed'}
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  This will set progress to 100% and notify HR/Admin via the completed task list.
                </p>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={task.description ?? ''}
              onChange={(e) => setTask((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Description"
            />
          </div>
        </div>

        {!isNew && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Comments
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c._id || c.createdAt} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-900">{c.text ?? c.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {c.user?.name ?? 'User'} · {formatDateTime(c.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  Add
                </button>
              </div>
            </div>
            {task.attachments?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Attachments
                </h3>
                <ul className="space-y-1">
                  {task.attachments.map((a) => (
                    <li key={a._id || a.name}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                        {a.name ?? a.filename ?? 'Attachment'}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
