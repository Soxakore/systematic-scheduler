-- Add unique constraint on user_id + date for journal upsert to work
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_user_id_date_key UNIQUE (user_id, date);