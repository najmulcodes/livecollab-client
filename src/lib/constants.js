/**
 * Shared constants — single source of truth.
 * Import from here in ALL components that need these values.
 * Fixes Issue 4: CardModal was using COLUMN_COLORS without importing it.
 */

// Matches the backend's card.column enum values
export const COLUMN_IDS = {
  TODO:       'todo',
  IN_PROGRESS:'inprogress',
  REVIEW:     'review',
  DONE:       'done',
};

export const COLUMN_COLORS = {
  todo:       '#F59E0B',
  inprogress: '#3b82f6',
  review:     '#8b5cf6',
  done:       '#10b981',
};

export const DEFAULT_COLUMNS = [
  { _id: 'todo',       title: 'To Do',       color: COLUMN_COLORS.todo },
  { _id: 'inprogress', title: 'In Progress',  color: COLUMN_COLORS.inprogress },
  { _id: 'review',     title: 'Review',       color: COLUMN_COLORS.review },
  { _id: 'done',       title: 'Done',         color: COLUMN_COLORS.done },
];

export const PRIORITY_COLORS = {
  low:    '#10b981',
  medium: '#F59E0B',
  high:   '#ef4444',
  urgent: '#dc2626',
};

export const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'LOW',    color: PRIORITY_COLORS.low },
  { value: 'medium', label: 'MED',    color: PRIORITY_COLORS.medium },
  { value: 'high',   label: 'HIGH',   color: PRIORITY_COLORS.high },
  { value: 'urgent', label: 'URGENT', color: PRIORITY_COLORS.urgent },
];
