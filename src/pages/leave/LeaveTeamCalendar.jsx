/**
 * Team leave calendar (color-coded)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { leaveService } from '../../services/leaveService';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export default function LeaveTeamCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await leaveService.getAll({});
        const list = res.data?.data ?? [];
        setEvents(
          list.map((l) => ({
            id: l._id,
            title: `${l.employee?.name ?? 'Leave'}: ${l.leaveType ?? 'Leave'}`,
            start: l.fromDate,
            end: l.toDate,
            color: l.status === 'Approved' ? '#10b981' : l.status === 'Pending' ? '#f59e0b' : '#ef4444',
          }))
        );
      } catch (e) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Skeleton className="h-[500px] rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Team leave calendar</h2>
        <Link to="/leave" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Leave
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
          height="auto"
        />
      </div>
    </div>
  );
}
