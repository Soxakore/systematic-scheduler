
-- Events: most queried table
CREATE INDEX IF NOT EXISTS idx_events_user_start ON public.events (user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_events_user_end ON public.events (user_id, end_time);
CREATE INDEX IF NOT EXISTS idx_events_user_calendar ON public.events (user_id, calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_system_id ON public.events (system_id) WHERE system_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_system_instance ON public.events (system_id, system_instance_date) WHERE system_id IS NOT NULL;

-- Journal entries
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries (user_id, date);

-- Daily scores
CREATE INDEX IF NOT EXISTS idx_daily_scores_user_date ON public.daily_scores (user_id, score_date);

-- Focus sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status ON public.focus_sessions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started ON public.focus_sessions (user_id, started_at);

-- Goals
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals (user_id, status);

-- Systems
CREATE INDEX IF NOT EXISTS idx_systems_user_active ON public.systems (user_id, is_active);

-- Tags
CREATE INDEX IF NOT EXISTS idx_tags_user ON public.tags (user_id);

-- Event tags (junction table)
CREATE INDEX IF NOT EXISTS idx_event_tags_event ON public.event_tags (event_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag ON public.event_tags (tag_id);

-- Event checklist items
CREATE INDEX IF NOT EXISTS idx_checklist_event ON public.event_checklist_items (event_id);
CREATE INDEX IF NOT EXISTS idx_checklist_user ON public.event_checklist_items (user_id);

-- Vision board
CREATE INDEX IF NOT EXISTS idx_vision_user ON public.vision_board_items (user_id);

-- Calendars
CREATE INDEX IF NOT EXISTS idx_calendars_user ON public.calendars (user_id);

-- Event templates
CREATE INDEX IF NOT EXISTS idx_templates_user ON public.event_templates (user_id);

-- System tags
CREATE INDEX IF NOT EXISTS idx_system_tags_system ON public.system_tags (system_id);
CREATE INDEX IF NOT EXISTS idx_system_tags_tag ON public.system_tags (tag_id);
