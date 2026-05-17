export const USER_ROLES = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const GOAL_STATUSES = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type GoalStatus = (typeof GOAL_STATUSES)[keyof typeof GOAL_STATUSES];

export const CHECKIN_STATUSES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
} as const;

export type CheckInStatus = (typeof CHECKIN_STATUSES)[keyof typeof CHECKIN_STATUSES];

export const AUDIT_ACTIONS = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  STATUS_CHANGED: "STATUS_CHANGED",
  GOAL_UPDATED: "GOAL_UPDATED",
  GOAL_LOCK_OVERRIDE: "GOAL_LOCK_OVERRIDE",
  CHECKIN_UPDATED: "CHECKIN_UPDATED",
  SHARED_GOAL_SYNC: "SHARED_GOAL_SYNC",
  WEIGHTAGE_CHANGED: "WEIGHTAGE_CHANGED",
  TARGET_CHANGED: "TARGET_CHANGED",
  MANAGER_REVIEW: "MANAGER_REVIEW",
  ADMIN_OVERRIDE: "ADMIN_OVERRIDE"
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
