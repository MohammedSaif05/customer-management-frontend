/**
 * Kanban board: To Do / In Progress / Done with drag & drop
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { taskService } from '../../services/taskService';
import { TASK_STATUS, PRIORITY_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Skeleton } from '../../components/common/Skeleton';

const COLUMNS = [
  { id: TASK_STATUS.TODO, title: 'To Do', color: 'bg-gray-100' },
  { id: TASK_STATUS.IN_PROGRESS, title: 'In Progress', color: 'bg-amber-50' },
  { id: TASK_STATUS.DONE, title: 'Done', color: 'bg-green-50' },
];

function TaskCard({ task, onDelete, canDelete }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <Link to={`/tasks/${task._id}`} className="font-medium text-gray-900 hover:text-primary-600 text-sm flex-1 min-w-0">
          {task.title}
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}`}>
            {task.priority || 'medium'}
          </span>
          {canDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
              className="p-1 text-gray-400 hover:text-red-600"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {task.deadline && (
        <p className="text-xs text-gray-500 mt-1">Due: {formatDate(task.deadline)}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full" style={{ width: `${task.progressPercent ?? 0}%` }} />
        </div>
        <span className="text-xs text-gray-500">{task.progressPercent ?? 0}%</span>
      </div>
    </div>
  );
}

export default function TaskKanban() {
  const { user } = useAuth();
  const canCreateDelete = user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER;
  const [tasksByStatus, setTasksByStatus] = useState({
    [TASK_STATUS.TODO]: [],
    [TASK_STATUS.IN_PROGRESS]: [],
    [TASK_STATUS.DONE]: [],
  });
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const { showToast } = useToast();

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (!canCreateDelete) {
        const userId = user?._id ?? user?.id;
        if (userId) params.assignedTo = userId;
      }
      const res = await taskService.getAll(params);
      const list = res.data?.data ?? [];
      const byStatus = {
        [TASK_STATUS.TODO]: list.filter((t) => t.status === TASK_STATUS.TODO),
        [TASK_STATUS.IN_PROGRESS]: list.filter((t) => t.status === TASK_STATUS.IN_PROGRESS),
        [TASK_STATUS.DONE]: list.filter((t) => t.status === TASK_STATUS.DONE),
      };
      setTasksByStatus(byStatus);
    } catch (e) {
      showToast(e.userMessage || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [canCreateDelete, user?._id, user?.id]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    try {
      await taskService.updateStatus(draggableId, newStatus);
      setTasksByStatus((prev) => {
        const sourceId = result.source.droppableId;
        const task = prev[sourceId].find((t) => t._id === draggableId);
        if (!task) return prev;
        const next = { ...prev };
        next[sourceId] = next[sourceId].filter((t) => t._id !== draggableId);
        next[newStatus] = [...(next[newStatus] || []), { ...task, status: newStatus }];
        return next;
      });
      showToast('Task status updated', 'success');
    } catch (e) {
      showToast(e.userMessage || 'Update failed', 'error');
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

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Task Kanban</h2>
        <div className="flex items-center gap-2">
          <Link to="/tasks" className="text-sm text-primary-600 hover:underline">List view</Link>
          {canCreateDelete && (
            <Link to="/tasks/new" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              <Plus className="w-4 h-4" /> New task
            </Link>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className={`rounded-xl border border-gray-200 p-4 ${col.color}`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {col.title} ({tasksByStatus[col.id]?.length ?? 0})
              </h3>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-white/60' : ''}`}
                  >
                    {(tasksByStatus[col.id] || []).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2"
                          >
                            <TaskCard
                              task={task}
                              onDelete={(id) => setDeleteModal({ open: true, id })}
                              canDelete={canCreateDelete}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

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
