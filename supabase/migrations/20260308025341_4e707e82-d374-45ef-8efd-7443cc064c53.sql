
-- Allow users to read events from calendars shared with them (accepted shares only)
CREATE POLICY "Users can view shared calendar events" ON public.events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_shares cs
    WHERE cs.calendar_id = events.calendar_id
      AND cs.shared_with_id = auth.uid()
      AND cs.status = 'accepted'
  )
);
