import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';
import type { Profile, Calendar, CalendarEvent, Tag, System, EventChecklistItem, EventTemplate, FocusSession, Goal, DailyScore } from '@/types';

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

// Get specifically the weekly review system
export function useWeeklyReviewSystem() {
  const { data: systems } = useSystems();
  return systems?.find(s => s.system_type === 'weekly_review') || null;
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

        // For weekly_review systems, seed checklist items per event
        if (system.system_type === 'weekly_review' && createdEvents && system.checklist_items.length > 0) {
          const checklistRows: any[] = [];
          for (const event of createdEvents) {
            system.checklist_items.forEach((item, idx) => {
              checklistRows.push({
                event_id: event.id,
                checklist_item_id: item.id,
                text: item.text,
                is_completed: false,
                sort_order: idx,
              });
            });
          }
          if (checklistRows.length > 0) {
            const { error: clErr } = await supabase.from('event_checklist_items').insert(checklistRows);
            if (clErr) console.error('Failed to seed checklist items:', clErr);
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event_checklist_items'] });
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

// Event Checklist Items
export function useEventChecklistItems(eventId: string | null) {
  return useQuery({
    queryKey: ['event_checklist_items', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_checklist_items')
        .select('*')
        .eq('event_id', eventId!)
        .order('sort_order');
      if (error) throw error;
      return data as EventChecklistItem[];
    },
    enabled: !!eventId,
  });
}

export function useToggleChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('event_checklist_items')
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event_checklist_items'] }),
  });
}

// ========== Event Completion (Habits/Streaks) ==========
export function useCompleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from('events').update({
        is_completed,
        completed_at: is_completed ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['daily_scores'] });
    },
  });
}

export function useSkipEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, skip_reason }: { id: string; skip_reason?: string }) => {
      const { error } = await supabase.from('events').update({
        skipped: true,
        skip_reason: skip_reason || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUnskipEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').update({
        skipped: false,
        skip_reason: null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

// Streak calculation for a system
export function useSystemStreak(systemId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['system_streak', systemId],
    queryFn: async () => {
      if (!systemId) return { current: 0, longest: 0 };
      const { data, error } = await supabase
        .from('events')
        .select('system_instance_date, is_completed')
        .eq('system_id', systemId)
        .eq('is_system_generated', true)
        .lte('start_time', new Date().toISOString())
        .order('system_instance_date', { ascending: false });
      if (error) throw error;

      let current = 0;
      let longest = 0;
      let streak = 0;
      for (const e of data || []) {
        if (e.is_completed) {
          streak++;
          longest = Math.max(longest, streak);
          if (streak === current + 1) current = streak;
        } else {
          if (current === 0) current = 0; // first non-completed breaks current
          streak = 0;
        }
      }
      return { current, longest };
    },
    enabled: !!user && !!systemId,
  });
}

// Completion heatmap data (last 90 days)
export function useCompletionHeatmap() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['completion_heatmap', user?.id],
    queryFn: async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data, error } = await supabase
        .from('events')
        .select('start_time, is_completed, is_system_generated')
        .eq('user_id', user!.id)
        .gte('start_time', ninetyDaysAgo.toISOString())
        .lte('start_time', new Date().toISOString());
      if (error) throw error;

      const map: Record<string, { total: number; completed: number }> = {};
      for (const e of data || []) {
        const date = e.start_time.split('T')[0];
        if (!map[date]) map[date] = { total: 0, completed: 0 };
        map[date].total++;
        if (e.is_completed) map[date].completed++;
      }
      return map;
    },
    enabled: !!user,
  });
}

// ========== Event Templates ==========
export function useEventTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['event_templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_templates').select('*').eq('user_id', user!.id).order('use_count', { ascending: false });
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
    mutationFn: async (tpl: Omit<EventTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'use_count'>) => {
      const { error } = await supabase.from('event_templates').insert({ ...tpl, user_id: user!.id } as any);
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

export function useIncrementTemplateUse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: tpl } = await supabase.from('event_templates').select('use_count').eq('id', id).single();
      const { error } = await supabase.from('event_templates').update({ use_count: (tpl?.use_count || 0) + 1 }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event_templates'] }),
  });
}

// ========== Focus Sessions (Pomodoro) ==========
export function useFocusSessions(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['focus_sessions', user?.id, date],
    queryFn: async () => {
      let query = supabase.from('focus_sessions').select('*').eq('user_id', user!.id);
      if (date) {
        query = query.gte('started_at', `${date}T00:00:00`).lte('started_at', `${date}T23:59:59`);
      }
      const { data, error } = await query.order('started_at', { ascending: false });
      if (error) throw error;
      return data as FocusSession[];
    },
    enabled: !!user,
  });
}

export function useCreateFocusSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (session: { event_id?: string; planned_minutes: number; session_type: string }) => {
      const { data, error } = await supabase.from('focus_sessions').insert({
        user_id: user!.id,
        event_id: session.event_id || null,
        planned_minutes: session.planned_minutes,
        session_type: session.session_type,
        started_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['focus_sessions'] }),
  });
}

export function useCompleteFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, actual_minutes }: { id: string; actual_minutes: number }) => {
      const { error } = await supabase.from('focus_sessions').update({
        ended_at: new Date().toISOString(),
        actual_minutes,
        completed: true,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus_sessions'] });
      qc.invalidateQueries({ queryKey: ['daily_scores'] });
    },
  });
}

export function useTodayFocusMinutes() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = useFocusSessions(today);
  return (data || []).filter(s => s.completed && s.session_type === 'focus').reduce((sum, s) => sum + (s.actual_minutes || 0), 0);
}

// ========== Goals ==========
export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('goals').select('*').eq('user_id', user!.id).order('created_at');
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
    mutationFn: async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
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

// Goal progress for current period
export function useGoalProgress(goal: Goal | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goal_progress', goal?.id],
    queryFn: async () => {
      if (!goal) return 0;
      const now = new Date();
      let startDate: Date;
      if (goal.goal_type === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      let query = supabase
        .from('events')
        .select('id')
        .eq('user_id', user!.id)
        .eq('is_completed', true)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', now.toISOString());

      if (goal.system_id) query = query.eq('system_id', goal.system_id);
      const { data, error } = await query;
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user && !!goal,
  });
}

// ========== Daily Scores ==========
export function useDailyScores(days: number = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily_scores', user?.id, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date');
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
        { onConflict: 'user_id,date' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily_scores'] }),
  });
}

// Tag time analytics
export function useTagAnalytics(days: number = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tag_analytics', user?.id, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: events } = await supabase
        .from('events')
        .select('id, start_time, end_time, title')
        .eq('user_id', user!.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', new Date().toISOString());

      if (!events || events.length === 0) return { byTag: new Map(), byWeek: new Map() };

      const eventIds = events.map(e => e.id);
      const { data: etags } = await supabase.from('event_tags').select('event_id, tag_id').in('event_id', eventIds);

      const { data: tags } = await supabase.from('tags').select('*').eq('user_id', user!.id);
      const tagMap = new Map((tags || []).map(t => [t.id, t]));

      // Calculate minutes per tag
      const byTag = new Map<string, { name: string; color: string; minutes: number; count: number }>();
      for (const e of events) {
        const mins = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000;
        const eventTagIds = (etags || []).filter(et => et.event_id === e.id).map(et => et.tag_id);
        for (const tid of eventTagIds) {
          const tag = tagMap.get(tid);
          if (!tag) continue;
          const existing = byTag.get(tid) || { name: tag.name, color: tag.color, minutes: 0, count: 0 };
          existing.minutes += mins;
          existing.count++;
          byTag.set(tid, existing);
        }
        if (eventTagIds.length === 0) {
          const existing = byTag.get('untagged') || { name: 'Untagged', color: '#94a3b8', minutes: 0, count: 0 };
          existing.minutes += mins;
          existing.count++;
          byTag.set('untagged', existing);
        }
      }

      return { byTag, totalEvents: events.length };
    },
    enabled: !!user,
  });
}

// Get next upcoming weekly review event
export function useNextWeeklyReviewEvent() {
  const { user } = useAuth();
  const { data: systems } = useSystems();
  const weeklyReview = systems?.find(s => s.system_type === 'weekly_review');

  return useQuery({
    queryKey: ['next_weekly_review', user?.id, weeklyReview?.id],
    queryFn: async () => {
      if (!weeklyReview) return null;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('system_id', weeklyReview.id)
        .eq('is_system_generated', true)
        .gte('start_time', now)
        .order('start_time')
        .limit(1)
        .single();
      if (error) return null;
      return data as CalendarEvent;
    },
    enabled: !!user && !!weeklyReview,
  });
}
