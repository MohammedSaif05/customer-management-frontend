/**
 * Task calendar view (FullCalendar)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { taskService } from '../../services/taskService';
import { Skeleton } from '../../components/common/Skeleton';

export default function TaskCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const userId = user?._id ?? user?.id;

  useEffect(() => {
    const load = async () => {
      try {
        const params = {};
        if (isEmployee && userId) params.assignedTo = userId;
        const res = await taskService.getAll(params);
        const list = res.data?.data ?? [];
        setEvents(
          list
            .filter((t) => t.deadline)
            .map((t) => ({
              id: t._id,
              title: t.title,
              start: t.deadline,
              extendedProps: { taskId: t._id, status: t.status, priority: t.priority },
              url: `/tasks/${t._id}`,
            }))
        );
      } catch (e) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEmployee, userId]);

  if (loading) return <Skeleton className="h-[500px] rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Task Calendar</h2>
        <Link to="/tasks" className="text-sm text-primary-600 hover:underline">List view</Link>
        <Link to="/tasks/kanban" className="text-sm text-primary-600 hover:underline">Kanban</Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            if (info.event.url) window.location.href = info.event.url;
          }}
          height="auto"
        />
      </div>
    </div>
  );
}
