import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';
import type { Profile, Calendar, CalendarEvent, Tag, System, Goal, DailyScore, FocusSession, EventTemplate, EventChecklistItem, JournalEntry, VisionBoardItem, CalendarShare, EventSuggestion } from '@/types';

// Profile
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

// Calendars
export function useCalendars() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['calendars', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('calendars').select('*').eq('user_id', user!.id).order('created_at');
      if (error) throw error;
      return data as Calendar[];
    },
    enabled: !!user,
  });
}

export function useCreateCalendar() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (cal: { name: string; color: string }) => {
      const { error } = await supabase.from('calendars').insert({ ...cal, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendars'] }),
  });
}

export function useUpdateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Calendar>) => {
      const { error } = await supabase.from('calendars').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendars'] }),
  });
}

export function useDeleteCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendars').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendars'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Events
export function useEvents(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['events', user?.id, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase.from('events').select('*').eq('user_id', user!.id);
      if (startDate) query = query.gte('end_time', startDate.toISOString());
      if (endDate) query = query.lte('start_time', endDate.toISOString());
      const { data, error } = await query.order('start_time');
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('events').insert({ ...event, user_id: user!.id }).select().single();
      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CalendarEvent>) => {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

// Tags
export function useTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').eq('user_id', user!.id).order('name');
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const { data, error } = await supabase.from('tags').insert({ ...tag, user_id: user!.id }).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('event_tags').delete().eq('tag_id', id);
      await supabase.from('system_tags').delete().eq('tag_id', id);
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['event_tags'] });
    },
  });
}

// Event Tags
export function useEventTags(eventId: string | null) {
  return useQuery({
    queryKey: ['event_tags', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_tags').select('tag_id').eq('event_id', eventId!);
      if (error) throw error;
      return data.map(r => r.tag_id) as string[];
    },
    enabled: !!eventId,
  });
}

export function useAllEventTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['all_event_tags', user?.id],
    queryFn: async () => {
      const { data: events } = await supabase.from('events').select('id').eq('user_id', user!.id);
      if (!events || events.length === 0) return new Map<string, string[]>();
      const eventIds = events.map(e => e.id);
      const { data, error } = await supabase.from('event_tags').select('event_id, tag_id').in('event_id', eventIds);
      if (error) throw error;
      const m = new Map<string, string[]>();
      (data || []).forEach(r => {
        const arr = m.get(r.event_id) || [];
        arr.push(r.tag_id);
        m.set(r.event_id, arr);
      });
      return m;
    },
    enabled: !!user,
  });
}

export function useSetEventTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, tagIds }: { eventId: string; tagIds: string[] }) => {
      await supabase.from('event_tags').delete().eq('event_id', eventId);
      if (tagIds.length > 0) {
        const { error } = await supabase.from('event_tags').insert(tagIds.map(tag_id => ({ event_id: eventId, tag_id })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event_tags'] });
      qc.invalidateQueries({ queryKey: ['all_event_tags'] });
    },
  });
}

// Systems
export function useSystems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['systems', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('systems').select('*').eq('user_id', user!.id).order('created_at');
      if (error) throw error;
      return (data || []).map(s => ({
        ...s,
        system_type: (s as any).system_type || 'routine',
        checklist_items: Array.isArray(s.checklist_items) ? s.checklist_items : [],
        recurrence_days: s.recurrence_days || [],
      })) as unknown as System[];
    },
    enabled: !!user,
  });
}

// Placeholder for weekly review system lookup
export function useWeeklyReviewSystem() {
  return null;
}

export function useCreateSystem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (system: Omit<System, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const payload = { ...system, user_id: user!.id, checklist_items: system.checklist_items as unknown as Json } as any;
      const { data, error } = await supabase.from('systems').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  });
}

export function useUpdateSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<System>) => {
      const payload = updates.checklist_items ? { ...updates, checklist_items: updates.checklist_items as unknown as Json } : updates;
      const { error } = await supabase.from('systems').update(payload as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systems'] }),
  });
}

export function useDeleteSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('systems').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['systems'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Generate system events
export function useGenerateSystemEvents() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (system: System) => {
      if (!system.is_active || !user) return;

      const today = new Date();
      const horizon = new Date(today);
      horizon.setDate(horizon.getDate() + system.generation_horizon_days);

      // Get existing system events to avoid duplicates
      const { data: existing } = await supabase
        .from('events')
        .select('system_instance_date')
        .eq('system_id', system.id)
        .eq('is_system_generated', true);

      const existingDates = new Set((existing || []).map(e => e.system_instance_date));

      const eventsToCreate: any[] = [];
      const current = new Date(today);

      while (current <= horizon) {
        const dayOfWeek = current.getDay();
        const dateStr = current.toISOString().split('T')[0];

        let shouldGenerate = false;
        if (system.recurrence_type === 'daily') {
          shouldGenerate = true;
        } else if (system.recurrence_type === 'weekly') {
          shouldGenerate = system.recurrence_days.includes(dayOfWeek);
        } else if (system.recurrence_type === 'custom') {
          shouldGenerate = system.recurrence_days.includes(dayOfWeek);
        }

        if (shouldGenerate && !existingDates.has(dateStr)) {
          const [hours, minutes] = (system.default_start_time || '09:00').split(':').map(Number);
          const startTime = new Date(current);
          startTime.setHours(hours, minutes, 0, 0);
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + system.default_duration_minutes);

          eventsToCreate.push({
            user_id: user.id,
            calendar_id: system.calendar_id,
            system_id: system.id,
            title: system.name,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_system_generated: true,
            is_customized: false,
            system_instance_date: dateStr,
            description: '',
            location: '',
            is_all_day: false,
          });
        }

        current.setDate(current.getDate() + 1);
      }

      if (eventsToCreate.length > 0) {
        const { data: createdEvents, error } = await supabase.from('events').insert(eventsToCreate).select();
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Delete future system events
export function useDeleteFutureSystemEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (systemId: string) => {
      const today = new Date().toISOString();
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('system_id', systemId)
        .eq('is_system_generated', true)
        .eq('is_customized', false)
        .gte('start_time', today);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

// Goals
export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('goals').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (goal: { title: string; description?: string; target_date?: string | null; status?: string; progress?: number }) => {
      const { error } = await supabase.from('goals').insert({ ...goal, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Goal>) => {
      const { error } = await supabase.from('goals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// Daily Scores
export function useDailyScores(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily_scores', user?.id, startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('daily_scores').select('*').eq('user_id', user!.id);
      if (startDate) query = query.gte('score_date', startDate);
      if (endDate) query = query.lte('score_date', endDate);
      const { data, error } = await query.order('score_date', { ascending: false });
      if (error) throw error;
      return data as DailyScore[];
    },
    enabled: !!user,
  });
}

export function useUpsertDailyScore() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (score: Omit<DailyScore, 'id' | 'user_id' | 'created_at'>) => {
      const { error } = await supabase.from('daily_scores').upsert(
        { ...score, user_id: user!.id },
        { onConflict: 'user_id,score_date' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily_scores'] }),
  });
}

// Focus Sessions
export function useFocusSessions(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['focus_sessions', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', user!.id).order('started_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data as FocusSession[];
    },
    enabled: !!user,
  });
}

export function useActiveSession() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['active_focus_session', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', user!.id).eq('status', 'active').maybeSingle();
      if (error) throw error;
      return data as FocusSession | null;
    },
    enabled: !!user,
  });
}

export function useStartFocusSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { duration_minutes: number; event_id?: string }) => {
      const { data, error } = await supabase.from('focus_sessions').insert({
        user_id: user!.id,
        duration_minutes: params.duration_minutes,
        event_id: params.event_id || null,
        status: 'active',
      }).select().single();
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus_sessions'] });
      qc.invalidateQueries({ queryKey: ['active_focus_session'] });
    },
  });
}

export function useEndFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'completed' | 'cancelled' }) => {
      const { error } = await supabase.from('focus_sessions').update({ status, ended_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus_sessions'] });
      qc.invalidateQueries({ queryKey: ['active_focus_session'] });
    },
  });
}

// Event Templates
export function useEventTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['event_templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_templates').select('*').eq('user_id', user!.id).order('name');
      if (error) throw error;
      return data as EventTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateEventTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tpl: Omit<EventTemplate, 'id' | 'user_id' | 'created_at'>) => {
      const { error } = await supabase.from('event_templates').insert({ ...tpl, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event_templates'] }),
  });
}

export function useDeleteEventTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event_templates'] }),
  });
}

// Event Checklist Items
export function useEventChecklistItems(eventId: string | null) {
  return useQuery({
    queryKey: ['event_checklist_items', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_checklist_items').select('*').eq('event_id', eventId!).order('sort_order');
      if (error) throw error;
      return data as EventChecklistItem[];
    },
    enabled: !!eventId,
  });
}

export function useCreateChecklistItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: { event_id: string; text: string; sort_order?: number }) => {
      const { error } = await supabase.from('event_checklist_items').insert({ ...item, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['event_checklist_items', vars.event_id] }),
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, event_id, ...updates }: { id: string; event_id: string } & Partial<EventChecklistItem>) => {
      const { error } = await supabase.from('event_checklist_items').update(updates).eq('id', id);
      if (error) throw error;
      return event_id;
    },
    onSuccess: (eventId) => qc.invalidateQueries({ queryKey: ['event_checklist_items', eventId] }),
  });
}

export function useDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, event_id }: { id: string; event_id: string }) => {
      const { error } = await supabase.from('event_checklist_items').delete().eq('id', id);
      if (error) throw error;
      return event_id;
    },
    onSuccess: (eventId) => qc.invalidateQueries({ queryKey: ['event_checklist_items', eventId] }),
  });
}
// ========== Journal Entries ==========
export function useJournalEntry(date: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['journal_entry', user?.id, date],
    queryFn: async () => {
      const { data, error } = await supabase.from('journal_entries' as any).select('*').eq('user_id', user!.id).eq('date', date).maybeSingle();
      if (error) throw error;
      return data as unknown as JournalEntry | null;
    },
    enabled: !!user && !!date,
  });
}

export function useJournalEntries(days: number = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['journal_entries', user?.id, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase.from('journal_entries' as any).select('*').eq('user_id', user!.id).gte('date', startDate.toISOString().split('T')[0]).order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as JournalEntry[];
    },
    enabled: !!user,
  });
}

export function useUpsertJournalEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('journal_entries' as any).upsert({ ...entry, user_id: user!.id, updated_at: new Date().toISOString() } as any, { onConflict: 'user_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal_entry'] });
      qc.invalidateQueries({ queryKey: ['journal_entries'] });
    },
  });
}

// ========== Vision Board ==========
export function useVisionBoardItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vision_board_items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('vision_board_items' as any).select('*').eq('user_id', user!.id).order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as VisionBoardItem[];
    },
    enabled: !!user,
  });
}

export function useCreateVisionBoardItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: Omit<VisionBoardItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('vision_board_items' as any).insert({ ...item, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision_board_items'] }),
  });
}

export function useUpdateVisionBoardItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<VisionBoardItem>) => {
      const { error } = await supabase.from('vision_board_items' as any).update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision_board_items'] }),
  });
}

export function useDeleteVisionBoardItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vision_board_items' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision_board_items'] }),
  });
}

// ─── Calendar Sharing ────────────────────────────────────────

export function useMyShares() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['calendar_shares', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_shares' as any).select('*').eq('owner_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as CalendarShare[];
    },
    enabled: !!user,
  });
}

export function useSharedWithMe() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['calendar_shares', 'with_me', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_shares' as any).select('*').eq('shared_with_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as CalendarShare[];
    },
    enabled: !!user,
  });
}

export function useCreateShare() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (share: { calendar_id: string; shared_with_email: string; permission: string }) => {
      const { data, error } = await supabase.from('calendar_shares' as any).insert({ ...share, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data as unknown as CalendarShare;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_shares'] }),
  });
}

export function useDeleteShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_shares' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_shares'] }),
  });
}

export function useRespondToShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('calendar_shares' as any).update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_shares'] }),
  });
}

export function useSharedCalendarEvents(calendarIds: string[], startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['shared_events', calendarIds, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (calendarIds.length === 0) return [];
      let query = supabase.from('events').select('*').in('calendar_id', calendarIds);
      if (startDate) query = query.gte('end_time', startDate.toISOString());
      if (endDate) query = query.lte('start_time', endDate.toISOString());
      const { data, error } = await query.order('start_time');
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: calendarIds.length > 0,
  });
}

// ─── Event Suggestions ──────────────────────────────────────

export function useIncomingSuggestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['event_suggestions', 'incoming', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_suggestions' as any).select('*').eq('to_user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as EventSuggestion[];
    },
    enabled: !!user,
  });
}

export function useOutgoingSuggestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['event_suggestions', 'outgoing', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_suggestions' as any).select('*').eq('from_user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as EventSuggestion[];
    },
    enabled: !!user,
  });
}

export function useCreateSuggestion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (suggestion: Omit<EventSuggestion, 'id' | 'from_user_id' | 'status' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('event_suggestions' as any).insert({ ...suggestion, from_user_id: user!.id }).select().single();
      if (error) throw error;
      return data as unknown as EventSuggestion;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event_suggestions'] }),
  });
}

export function useRespondToSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('event_suggestions' as any).update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event_suggestions'] }),
  });
}
