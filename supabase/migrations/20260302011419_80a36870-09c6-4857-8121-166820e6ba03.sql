
-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  mood INTEGER,
  energy INTEGER,
  gratitude TEXT[] DEFAULT '{}',
  wins TEXT[] DEFAULT '{}',
  lessons TEXT[] DEFAULT '{}',
  intentions TEXT[] DEFAULT '{}',
  free_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journal entries"
  ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create vision_board_items table
CREATE TABLE public.vision_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'star',
  position_x NUMERIC NOT NULL DEFAULT 0,
  position_y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 200,
  height NUMERIC NOT NULL DEFAULT 200,
  image_url TEXT,
  is_achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vision_board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vision board items"
  ON public.vision_board_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_vision_board_items_updated_at
  BEFORE UPDATE ON public.vision_board_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
