# Employee Management System – Frontend

Production-ready React frontend for an Employee Management System, connected to a Node.js + Express + MongoDB backend.

## Tech stack

- **React 18** (Vite)
- **JavaScript (ES6+)**
- **Tailwind CSS**
- **React Router DOM v6**
- **Axios** (API + interceptors)
- **Context API** (Auth, Toast)
- **Recharts** (Bar, Line, Pie)
- **FullCalendar** (Tasks & leave calendar)
- **react-beautiful-dnd** (Kanban drag & drop)
- **Headless UI** (Modals, transitions)
- **Lucide React** (Icons)
- **react-hot-toast** (Notifications)

## Project structure

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/       # Skeleton, ConfirmModal, EmptyState
│   │   ├── layout/       # Sidebar, Navbar, Breadcrumb, MainLayout
│   │   ├── charts/       # BarChartCard, LineChartCard, PieChartCard
│   │   └── forms/        # (reusable form bits as needed)
│   ├── pages/
│   │   ├── auth/         # Login, ForgotPassword
│   │   ├── dashboard/    # EmployeeDashboard, AdminDashboard
│   │   ├── tasks/        # TaskList, TaskKanban, TaskCalendar, TaskDetail
│   │   ├── payroll/      # PayrollList, PayrollSlipDetail, Attendance, Reimbursements
│   │   ├── leave/        # LeaveApply, LeaveHistory, LeaveTeamCalendar, LeaveApprovals
│   │   ├── employees/    # EmployeeDirectory, EmployeeDetail
│   │   ├── profile/      # Profile
│   │   └── reports/      # Reports (Admin/Manager)
│   ├── routes/           # AppRoutes, ProtectedRoute
│   ├── context/          # AuthContext, ToastContext
│   ├── services/         # api, authService, taskService, payrollService, etc.
│   ├── hooks/            # useApi
│   ├── utils/            # constants, helpers
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:5000` with API at `/api`

### Install and run

```bash
# Install dependencies
npm install

# Create env (optional – defaults to http://localhost:5000/api)
cp .env.example .env
# Edit .env if your API base URL is different:
# VITE_API_BASE_URL=http://localhost:5000/api

# Development
npm run dev
# App: http://localhost:3000

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment variables

| Variable              | Description                    | Default                    |
|-----------------------|--------------------------------|----------------------------|
| `VITE_API_BASE_URL`   | Backend API base URL           | `http://localhost:5000/api` |

## Authentication & routing

- **Login** – JWT-based; token and user stored in `localStorage`.
- **Forgot password** – Calls backend `/auth/forgot-password`.
- **Protected routes** – Wrapped in `ProtectedRoute`; redirect to `/login` if unauthenticated.
- **Role-based routes** – `allowedRoles` on `ProtectedRoute` (e.g. Admin, Manager).
- **Session** – Persisted via token; 401 from API clears token and triggers logout.
- **Auto logout** – Token expiry checked on load and on API 401.

## Features by module

- **Dashboards** – Employee (tasks, leave, notifications, calendar, announcements) and Admin (stats, leave approvals, charts).
- **Tasks** – List (filters, bulk delete), Kanban (drag & drop), Calendar, Detail (edit, comments, progress).
- **Payroll** – Salary slip list/detail, download PDF, attendance (clock-in/out), reimbursements.
- **Leave** – Apply leave, balance, history, team calendar, approvals (Admin/Manager).
- **Employees** – Directory (search, filters, card/list), profile view/edit, org chart link.
- **Profile** – View/edit personal details, documents, profile completion.
- **Reports** – Charts for employees, leave, payroll, tasks (Admin/Manager).

## API integration

- **Axios** – Base URL and JSON headers in `src/services/api.js`.
- **Interceptors** – Request: add `Authorization: Bearer <token>`; Response: on 401 clear token and trigger logout.
- **Services** – One file per domain (auth, tasks, payroll, leave, employees, reports, announcements, notifications).
- **Error handling** – Toasts for user-facing errors; loading/error state in components.

## Backend API expectations

The frontend expects these endpoints (adjust paths to match your backend):

- **Auth:** `POST /auth/login`, `POST /auth/forgot-password`, `GET /auth/me`
- **Tasks:** `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `PATCH /tasks/:id/status`, `GET/POST /tasks/:id/comments`
- **Payroll:** `GET /payroll/slips`, `GET /payroll/slips/:id`, `GET /payroll/slips/:id/download`, `POST /payroll/attendance/clock-in`, `POST /payroll/attendance/clock-out`, `GET /payroll/attendance`, `GET /payroll/reimbursements`, `POST /payroll/reimbursements`
- **Leave:** `GET /leave/balance`, `POST /leave`, `GET /leave/my`, `GET /leave`, `GET /leave/:id`, `PATCH /leave/:id/approve`, `PATCH /leave/:id/reject`, `GET /leave/policy`, `GET /leave/team-calendar`
- **Employees:** `GET /employees`, `GET /employees/:id`, `PATCH /employees/:id`, `GET /employees/:id/documents`, `GET /employees/org-chart`, `GET /employees/:id/employment-history`
- **Reports:** `GET /reports/dashboard-stats`, `GET /reports/employee-stats`, `GET /reports/leave-stats`, `GET /reports/payroll-summary`, `GET /reports/task-overview`
- **Announcements:** `GET /announcements`
- **Notifications:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

Response shapes are flexible (e.g. `data.tasks` or `data` array); components normalize as needed.

## Role-based UI

- **Employee** – My Dashboard, Tasks, Payroll, Leave, Employees, Profile.
- **Manager / Admin** – Same + Admin Dashboard, Leave Approvals, Reports; sidebar and routes reflect role.

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve with any static host; ensure `VITE_API_BASE_URL` points to your production API.
