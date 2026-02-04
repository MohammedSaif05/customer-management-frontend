/**
 * Application constants – aligned with API doc (roles, task status, leave status)
 */

// API uses uppercase: ADMIN, MANAGER, EMPLOYEE
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

// API: ToDo | InProgress | Done
export const TASK_STATUS = {
  TODO: 'ToDo',
  IN_PROGRESS: 'InProgress',
  DONE: 'Done',
};

// API: High | Medium | Low
export const TASK_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

// API: Pending | Approved | Rejected
export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-green-100 text-green-800 border-green-200',
};

export const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};
