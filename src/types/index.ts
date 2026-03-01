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
  description: string | null;
  location: string | null;
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

export interface System {
  id: string;
  user_id: string;
  calendar_id: string;
  name: string;
  default_duration_minutes: number;
  time_window: string | null;
  recurrence_type: 'daily' | 'weekly' | 'custom';
  recurrence_days: number[];
  is_active: boolean;
  checklist_items: ChecklistItem[];
  generation_horizon_days: number;
  default_start_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ViewType = 'month' | 'week' | 'day' | 'agenda';
