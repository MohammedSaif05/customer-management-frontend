/**
 * Employee Dashboard – card-based, notifications, progress bars, calendar
 * Employee-only view with full functionality per requirements
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  CalendarDays,
  Bell,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  LogIn,
  LogOut,
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { leaveService } from '../../services/leaveService';
import { attendanceService } from '../../services/attendanceService';
import { PRIORITY_COLORS, TASK_STATUS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { SkeletonCard, Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import AnnouncementsCard from '../../components/dashboard/AnnouncementsCard';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const { showToast } = useToast();

  const loadAttendance = async () => {
    try {
      const res = await attendanceService.getAll({ limit: 30 });
      const list = res.data?.data ?? [];
      const today = new Date().toISOString().slice(0, 10);
      const todayItem = Array.isArray(list) ? list.find((a) => a.date?.slice?.(0, 10) === today) : null;
      setTodayAttendance(todayItem ?? null);
    } catch {
      setTodayAttendance(null);
    }
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      await attendanceService.clockIn();
      await loadAttendance();
      showToast('Clocked in', 'success');
    } catch (e) {
      showToast(e?.userMessage || 'Clock-in failed', 'error');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      await attendanceService.clockOut();
      await loadAttendance();
      showToast('Clocked out', 'success');
    } catch (e) {
      showToast(e?.userMessage || 'Clock-out failed', 'error');
    } finally {
      setClockLoading(false);
    }
  };

  const canClockIn = !todayAttendance?.clockIn;
  const canClockOut = todayAttendance?.clockIn && !todayAttendance?.clockOut;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await loadAttendance();
        const taskParams = { limit: 50 };
        const userId = user?._id ?? user?.id;
        if (userId) taskParams.assignedTo = userId;
        const [tasksRes, balanceRes, leavesRes] = await Promise.allSettled([
          taskService.getAll(taskParams),
          leaveService.getBalance(),
          leaveService.getAll({ limit: 10 }),
        ]);

        const taskList = tasksRes.status === 'fulfilled' ? (tasksRes.value?.data?.data ?? []) : [];
        setTasks(taskList);

        setLeaveBalance(balanceRes.status === 'fulfilled' ? (balanceRes.value?.data?.data ?? balanceRes.value?.data) : null);
        setLeaves(leavesRes.status === 'fulfilled' ? (leavesRes.value?.data?.data ?? []) : []);

        const events = [];
        taskList.forEach((t) => {
          if (t.deadline)
            events.push({
              title: t.title,
              start: t.deadline,
              color: t.priority === 'High' ? '#ef4444' : t.priority === 'Medium' ? '#f59e0b' : '#10b981',
              extendedProps: { type: 'task' },
            });
        });
        (leavesRes.status === 'fulfilled' ? (leavesRes.value?.data?.data ?? []) : []).forEach((l) => {
          if (l.fromDate && l.toDate)
            events.push({
              title: `Leave: ${l.leaveType || 'Leave'}`,
              start: l.fromDate,
              end: l.toDate,
              color: l.status === 'Approved' ? '#10b981' : l.status === 'Pending' ? '#f59e0b' : '#ef4444',
              extendedProps: { type: 'leave' },
            });
        });
        setCalendarEvents(events);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?._id, user?.id]);

  const pendingTasks = tasks.filter((t) => t.status !== TASK_STATUS.DONE);
  const completedTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE);
  const upcomingLeaves = leaves.filter((l) => l.status === 'Approved' && new Date(l.toDate) >= new Date());
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const availableBalance = leaveBalance?.casualRemaining ?? leaveBalance?.earnedRemaining ?? 0;
  const taskProgress = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Notifications: pending approvals, new tasks, upcoming deadlines
  const notifications = [
    ...pendingLeaves.map((l) => ({
      id: `leave-${l._id}`,
      type: 'approval',
      title: 'Leave pending approval',
      message: `${l.leaveType ?? 'Leave'} (${formatDate(l.fromDate)} – ${formatDate(l.toDate)})`,
      time: l.createdAt,
    })),
    ...pendingTasks
      .filter((t) => t.deadline && new Date(t.deadline) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
      .slice(0, 3)
      .map((t) => ({
        id: `deadline-${t._id}`,
        type: 'deadline',
        title: 'Deadline soon',
        message: t.title,
        time: t.deadline,
      })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl p-5 bg-gradient-to-r from-primary-500 to-blue-600 text-white shadow-lg">
        <h2 className="text-xl font-bold">My Dashboard</h2>
        <p className="text-primary-100 text-sm mt-1">
          Tasks, leave, and announcements at a glance
        </p>
      </div>

      {/* Clock-in widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-600" /> Today&apos;s attendance
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {todayAttendance?.clockIn && (
            <div>
              <span className="text-sm text-gray-500">Clocked in</span>
              <p className="font-medium text-gray-900">{formatDateTime(todayAttendance.clockIn)}</p>
            </div>
          )}
          {todayAttendance?.clockOut && (
            <div>
              <span className="text-sm text-gray-500">Clocked out</span>
              <p className="font-medium text-gray-900">{formatDateTime(todayAttendance.clockOut)}</p>
            </div>
          )}
          <div className="flex gap-2">
            {canClockIn && (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={clockLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" /> Clock in
              </button>
            )}
            {canClockOut && (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={clockLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" /> Clock out
              </button>
            )}
          </div>
          {!canClockIn && !canClockOut && !todayAttendance?.clockIn && (
            <p className="text-sm text-gray-500">Not clocked in today</p>
          )}
          <Link
            to="/payroll/attendance"
            className="text-sm text-primary-600 hover:underline ml-auto"
          >
            View full attendance
          </Link>
        </div>
      </div>

      {/* Quick stats – card-based */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
              <p className="text-sm text-gray-500">Pending tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
              <p className="text-sm text-gray-500">Tasks completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{availableBalance}</p>
              <p className="text-sm text-gray-500">Leave balance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingLeaves.length}</p>
              <p className="text-sm text-gray-500">Upcoming leaves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Task completion progress</h3>
          <span className="text-sm font-medium text-primary-600">{taskProgress}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${taskProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {completedTasks.length} of {tasks.length} tasks completed
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending tasks – priority color coding */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Pending tasks</h3>
            <Link
              to="/tasks"
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <EmptyState title="No pending tasks" description="All caught up!" />
            ) : (
              pendingTasks.slice(0, 6).map((t) => (
                <Link
                  key={t._id}
                  to={`/tasks/${t._id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium text-gray-900 truncate flex-1">{t.title}</span>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded border ${
                        PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.Medium
                      }`}
                    >
                      {t.priority || 'Medium'}
                    </span>
                  </div>
                  {t.deadline && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {formatDate(t.deadline)}
                    </p>
                  )}
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${t.progressPercent ?? 0}%` }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Leave status / approvals */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Leave status</h3>
            <Link
              to="/leave"
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              Apply leave <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leaves.length === 0 ? (
              <EmptyState title="No leave records" description="Apply leave when needed." />
            ) : (
              leaves.slice(0, 6).map((l) => (
                <div
                  key={l._id}
                  className="p-3 rounded-lg border border-gray-100 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">{l.leaveType ?? 'Leave'}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(l.fromDate)} – {formatDate(l.toDate)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      l.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : l.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-600" /> Notifications
        </h3>
        {notifications.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 text-gray-500 text-sm">
            <FileCheck className="w-4 h-4" /> No new notifications
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(n.time)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnnouncementsCard limit={5} showPinnedFirst expired={false} />

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary-600" /> Calendar – deadlines & events
        </h3>
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek',
          }}
          height="auto"
        />
      </div>
    </div>
  );
}
