export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
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

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_date: string | null;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface DailyScore {
  id: string;
  user_id: string;
  score_date: string;
  total_events: number;
  completed_events: number;
  focus_minutes: number;
  score: number;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  event_id: string | null;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface EventTemplate {
  id: string;
  user_id: string;
  name: string;
  title: string;
  description: string;
  duration_minutes: number;
  location: string;
  calendar_id: string | null;
  is_all_day: boolean;
  created_at: string;
}

export interface EventChecklistItem {
  id: string;
  event_id: string;
  user_id: string;
  text: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  mood: number | null;
  energy: number | null;
  gratitude: string[];
  wins: string[];
  lessons: string[];
  intentions: string[];
  free_text: string;
  created_at: string;
  updated_at: string;
}

export interface VisionBoardItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  image_url: string | null;
  is_achieved: boolean;
  achieved_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarShare {
  id: string;
  calendar_id: string;
  owner_id: string;
  shared_with_email: string;
  shared_with_id: string | null;
  permission: 'view' | 'suggest';
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface EventSuggestion {
  id: string;
  from_user_id: string;
  to_user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  calendar_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ViewType = 'month' | 'week' | 'day' | 'agenda';
