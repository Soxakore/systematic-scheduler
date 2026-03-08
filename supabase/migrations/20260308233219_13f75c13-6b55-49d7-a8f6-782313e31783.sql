
-- Create vision_boards table
CREATE TABLE public.vision_boards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Vision Board',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vision_boards ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage own vision boards"
  ON public.vision_boards
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add board_id to vision_board_items (nullable for backward compat)
ALTER TABLE public.vision_board_items
  ADD COLUMN board_id uuid REFERENCES public.vision_boards(id) ON DELETE CASCADE;

-- Add board_id to vision_board_connections (nullable for backward compat)
ALTER TABLE public.vision_board_connections
  ADD COLUMN board_id uuid REFERENCES public.vision_boards(id) ON DELETE CASCADE;
