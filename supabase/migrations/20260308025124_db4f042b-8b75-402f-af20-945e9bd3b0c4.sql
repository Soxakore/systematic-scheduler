
-- Calendar sharing table
CREATE TABLE public.calendar_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  shared_with_id uuid,
  permission text NOT NULL DEFAULT 'view',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Owners can manage shares" ON public.calendar_shares
FOR ALL TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Shared-with user can view and update status of shares
CREATE POLICY "Recipients can view shares" ON public.calendar_shares
FOR SELECT TO authenticated
USING (auth.uid() = shared_with_id);

CREATE POLICY "Recipients can update share status" ON public.calendar_shares
FOR UPDATE TO authenticated
USING (auth.uid() = shared_with_id)
WITH CHECK (auth.uid() = shared_with_id);

-- Event suggestions table
CREATE TABLE public.event_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_all_day boolean NOT NULL DEFAULT false,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_suggestions ENABLE ROW LEVEL SECURITY;

-- Sender can manage their suggestions
CREATE POLICY "Senders can manage suggestions" ON public.event_suggestions
FOR ALL TO authenticated
USING (auth.uid() = from_user_id)
WITH CHECK (auth.uid() = from_user_id);

-- Recipient can view and update suggestions
CREATE POLICY "Recipients can view suggestions" ON public.event_suggestions
FOR SELECT TO authenticated
USING (auth.uid() = to_user_id);

CREATE POLICY "Recipients can update suggestions" ON public.event_suggestions
FOR UPDATE TO authenticated
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- Indexes
CREATE INDEX idx_calendar_shares_owner ON public.calendar_shares (owner_id);
CREATE INDEX idx_calendar_shares_recipient ON public.calendar_shares (shared_with_id);
CREATE INDEX idx_calendar_shares_email ON public.calendar_shares (shared_with_email);
CREATE INDEX idx_calendar_shares_calendar ON public.calendar_shares (calendar_id);
CREATE INDEX idx_event_suggestions_from ON public.event_suggestions (from_user_id);
CREATE INDEX idx_event_suggestions_to ON public.event_suggestions (to_user_id, status);

-- Function to resolve email to user id when profile exists
CREATE OR REPLACE FUNCTION public.resolve_share_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT u.id INTO NEW.shared_with_id
  FROM auth.users u
  WHERE u.email = NEW.shared_with_email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER resolve_share_recipient_trigger
BEFORE INSERT ON public.calendar_shares
FOR EACH ROW
EXECUTE FUNCTION public.resolve_share_recipient();
