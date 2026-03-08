CREATE TABLE public.vision_board_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_item_id UUID NOT NULL REFERENCES public.vision_board_items(id) ON DELETE CASCADE,
  to_item_id UUID NOT NULL REFERENCES public.vision_board_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_item_id, to_item_id)
);

ALTER TABLE public.vision_board_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON public.vision_board_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);