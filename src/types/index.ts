export interface Profile {
  id: string;
  name: string;
  timezone: string;
  week_start_day: number;
  default_view: 'month' | 'week' | 'day' | 'agenda';
  created_at: string;
  updated_at: string;
}

export interface Calendar {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_visible: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  calendar_id: string;
  system_id: string | null;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_system_generated: boolean;
  is_customized: boolean;
  system_instance_date: string | null;
  reminder_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type SystemType = 'routine' | 'weekly_review';

export interface System {
  id: string;
  user_id: string;
  calendar_id: string;
  name: string;
  system_type: SystemType;
  default_duration_minutes: number;
  time_window: string;
  recurrence_type: 'daily' | 'weekly' | 'custom';
  recurrence_days: number[];
  is_active: boolean;
  checklist_items: ChecklistItem[];
  generation_horizon_days: number;
  default_start_time: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface EventChecklistItem {
  id: string;
  event_id: string;
  checklist_item_id: string;
  text: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export type ViewType = 'month' | 'week' | 'day' | 'agenda';

// Default weekly review checklist template
export const WEEKLY_REVIEW_DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'wr-1', text: 'Review last week\'s calendar and completed tasks', completed: false },
  { id: 'wr-2', text: 'List wins and what went well', completed: false },
  { id: 'wr-3', text: 'Note what didn\'t go well and why', completed: false },
  { id: 'wr-4', text: 'Review key systems (health, work, relationships, money) and adjust if needed', completed: false },
  { id: 'wr-5', text: 'Choose top 3 priorities for next week', completed: false },
  { id: 'wr-6', text: 'Time-block these priorities in the calendar', completed: false },
];
