-- Add system_type to systems table
ALTER TABLE public.systems
  ADD COLUMN IF NOT EXISTS system_type TEXT NOT NULL DEFAULT 'routine'
  CHECK (system_type IN ('routine', 'weekly_review'));

-- Create event_checklist_items table for per-event checklist tracking
CREATE TABLE IF NOT EXISTS public.event_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL,  -- matches the id from the system's checklist_items JSONB
  text TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by event
CREATE INDEX IF NOT EXISTS idx_event_checklist_items_event
  ON public.event_checklist_items(event_id);

-- RLS
ALTER TABLE public.event_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own event checklist items"
  ON public.event_checklist_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_checklist_items.event_id
        AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_checklist_items.event_id
        AND e.user_id = auth.uid()
    )
  );
