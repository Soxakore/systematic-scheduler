import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-scheduler-user-id",
};

function getSupabase() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

let currentUserId = "";
const db = () => getSupabase();
const uid = () => currentUserId;

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string) {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }] };
}

const mcpServer = new McpServer({ name: "systematic-scheduler", version: "1.0.0" });

// ─── CALENDAR EVENTS ────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_events", {
  description: "List calendar events in a date range.",
  inputSchema: { type: "object", properties: {
    start_date: { type: "string", description: "ISO date (default: today)" },
    end_date: { type: "string", description: "ISO date (default: +30 days)" },
    calendar_id: { type: "string" }, limit: { type: "number" },
  }},
  handler: async (params: any) => {
    const now = new Date();
    const start = params.start_date || now.toISOString();
    const end = params.end_date || new Date(now.getTime() + 30 * 86400000).toISOString();
    let q = db().from("events").select("*").eq("user_id", uid()).gte("start_time", start).lte("start_time", end).order("start_time").limit(params.limit || 50);
    if (params.calendar_id) q = q.eq("calendar_id", params.calendar_id);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok({ count: data?.length ?? 0, events: data });
  },
});

mcpServer.tool("scheduler_search_events", {
  description: "Search events by title or description.",
  inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } }, required: ["query"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("events").select("*").eq("user_id", uid())
      .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
      .order("start_time", { ascending: false }).limit(params.limit || 20);
    if (error) return err(error.message);
    return ok({ count: data?.length ?? 0, events: data });
  },
});

mcpServer.tool("scheduler_create_event", {
  description: "Create a new calendar event.",
  inputSchema: { type: "object", properties: {
    title: { type: "string" }, start_time: { type: "string" }, end_time: { type: "string" },
    calendar_id: { type: "string" }, description: { type: "string" }, location: { type: "string" },
    is_all_day: { type: "boolean" }, reminder_minutes: { type: "number" },
  }, required: ["title", "start_time", "end_time"] },
  handler: async (params: any) => {
    let calId = params.calendar_id;
    if (!calId) {
      const { data: cals } = await db().from("calendars").select("id").eq("user_id", uid()).limit(1);
      calId = cals?.[0]?.id;
      if (!calId) return err("No calendars found.");
    }
    const { data, error } = await db().from("events").insert({
      user_id: uid(), calendar_id: calId, title: params.title,
      start_time: params.start_time, end_time: params.end_time,
      description: params.description ?? null, location: params.location ?? null,
      is_all_day: params.is_all_day ?? false, reminder_minutes: params.reminder_minutes ?? null,
      is_system_generated: false, is_customized: false,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Event created", event: data });
  },
});

mcpServer.tool("scheduler_update_event", {
  description: "Update an existing event by ID.",
  inputSchema: { type: "object", properties: {
    event_id: { type: "string" }, title: { type: "string" }, start_time: { type: "string" },
    end_time: { type: "string" }, description: { type: "string" }, location: { type: "string" },
    is_all_day: { type: "boolean" }, reminder_minutes: { type: "number" },
  }, required: ["event_id"] },
  handler: async (params: any) => {
    const { event_id, ...updates } = params;
    const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    if (Object.keys(clean).length === 0) return err("No fields to update.");
    const { data, error } = await db().from("events")
      .update({ ...clean, updated_at: new Date().toISOString() })
      .eq("id", event_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Event updated", event: data });
  },
});

mcpServer.tool("scheduler_delete_event", {
  description: "Delete a calendar event.",
  inputSchema: { type: "object", properties: { event_id: { type: "string" } }, required: ["event_id"] },
  handler: async (params: any) => {
    const { error } = await db().from("events").delete().eq("id", params.event_id).eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ message: "Event deleted" });
  },
});

// ─── CALENDARS ──────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_calendars", {
  description: "List all user calendars.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data, error } = await db().from("calendars").select("*").eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ calendars: data });
  },
});

// ─── GOALS ──────────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_goals", {
  description: "List user goals.",
  inputSchema: { type: "object", properties: { status: { type: "string", description: "active, completed, or archived" } } },
  handler: async (params: any) => {
    let q = db().from("goals").select("*").eq("user_id", uid()).order("created_at", { ascending: false });
    if (params.status) q = q.eq("status", params.status);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok({ goals: data });
  },
});

mcpServer.tool("scheduler_create_goal", {
  description: "Create a new goal.",
  inputSchema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, target_date: { type: "string" } }, required: ["title"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("goals").insert({
      user_id: uid(), title: params.title, description: params.description ?? "",
      target_date: params.target_date ?? null, status: "active", progress: 0,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Goal created", goal: data });
  },
});

mcpServer.tool("scheduler_update_goal", {
  description: "Update goal fields.",
  inputSchema: { type: "object", properties: {
    goal_id: { type: "string" }, title: { type: "string" }, description: { type: "string" },
    status: { type: "string" }, progress: { type: "number" }, target_date: { type: "string" },
  }, required: ["goal_id"] },
  handler: async (params: any) => {
    const { goal_id, ...updates } = params;
    const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const { data, error } = await db().from("goals")
      .update({ ...clean, updated_at: new Date().toISOString() })
      .eq("id", goal_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Goal updated", goal: data });
  },
});

mcpServer.tool("scheduler_delete_goal", {
  description: "Delete a goal.",
  inputSchema: { type: "object", properties: { goal_id: { type: "string" } }, required: ["goal_id"] },
  handler: async (params: any) => {
    const { error } = await db().from("goals").delete().eq("id", params.goal_id).eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ message: "Goal deleted" });
  },
});

// ─── JOURNAL ────────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_get_journal", {
  description: "Get journal entry for a date (YYYY-MM-DD).",
  inputSchema: { type: "object", properties: { date: { type: "string" } }, required: ["date"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("journal_entries").select("*")
      .eq("user_id", uid()).eq("date", params.date).maybeSingle();
    if (error) return err(error.message);
    return ok({ entry: data });
  },
});

mcpServer.tool("scheduler_list_journal", {
  description: "List recent journal entries.",
  inputSchema: { type: "object", properties: { days: { type: "number" } } },
  handler: async (params: any) => {
    const since = new Date(Date.now() - (params.days || 30) * 86400000).toISOString().slice(0, 10);
    const { data, error } = await db().from("journal_entries").select("*")
      .eq("user_id", uid()).gte("date", since).order("date", { ascending: false });
    if (error) return err(error.message);
    return ok({ count: data?.length ?? 0, entries: data });
  },
});

mcpServer.tool("scheduler_upsert_journal", {
  description: "Create or update a journal entry.",
  inputSchema: { type: "object", properties: {
    date: { type: "string" }, mood: { type: "number" }, energy: { type: "number" },
    gratitude: { type: "array", items: { type: "string" } },
    wins: { type: "array", items: { type: "string" } },
    lessons: { type: "array", items: { type: "string" } },
    intentions: { type: "array", items: { type: "string" } },
    free_text: { type: "string" },
  }, required: ["date"] },
  handler: async (params: any) => {
    const { date, ...fields } = params;
    const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    const { data, error } = await db().from("journal_entries").upsert({
      user_id: uid(), date, ...clean, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,date" }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Journal saved", entry: data });
  },
});

// ─── VISION BOARD ───────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_vision", {
  description: "List vision board items.",
  inputSchema: { type: "object", properties: { category: { type: "string" } } },
  handler: async (params: any) => {
    let q = db().from("vision_board_items").select("*").eq("user_id", uid()).order("sort_order");
    if (params.category) q = q.eq("category", params.category);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok({ items: data });
  },
});

mcpServer.tool("scheduler_create_vision_item", {
  description: "Add a vision board item.",
  inputSchema: { type: "object", properties: {
    title: { type: "string" }, description: { type: "string" }, category: { type: "string" },
    color: { type: "string" }, image_url: { type: "string" },
  }, required: ["title"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("vision_board_items").insert({
      user_id: uid(), title: params.title, description: params.description ?? "",
      category: params.category ?? "general", color: params.color ?? "#6366f1",
      icon: "star", position_x: 0, position_y: 0, width: 1, height: 1,
      image_url: params.image_url ?? null, is_achieved: false, sort_order: 0,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Vision item created", item: data });
  },
});

mcpServer.tool("scheduler_update_vision_item", {
  description: "Update a vision board item.",
  inputSchema: { type: "object", properties: {
    item_id: { type: "string" }, title: { type: "string" }, description: { type: "string" },
    category: { type: "string" }, is_achieved: { type: "boolean" }, image_url: { type: "string" },
  }, required: ["item_id"] },
  handler: async (params: any) => {
    const { item_id, ...updates } = params;
    const clean: Record<string, unknown> = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    if (clean.is_achieved === true) clean.achieved_at = new Date().toISOString();
    clean.updated_at = new Date().toISOString();
    const { data, error } = await db().from("vision_board_items")
      .update(clean).eq("id", item_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Vision item updated", item: data });
  },
});

mcpServer.tool("scheduler_delete_vision_item", {
  description: "Delete a vision board item.",
  inputSchema: { type: "object", properties: { item_id: { type: "string" } }, required: ["item_id"] },
  handler: async (params: any) => {
    const { error } = await db().from("vision_board_items").delete().eq("id", params.item_id).eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ message: "Vision item deleted" });
  },
});

// ─── FOCUS SESSIONS ─────────────────────────────────────────────────────────

mcpServer.tool("scheduler_start_focus", {
  description: "Start a focus session.",
  inputSchema: { type: "object", properties: {
    duration_minutes: { type: "number" }, event_id: { type: "string" },
  }, required: ["duration_minutes"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("focus_sessions").insert({
      user_id: uid(), event_id: params.event_id ?? null,
      duration_minutes: params.duration_minutes, started_at: new Date().toISOString(), status: "active",
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Focus session started", session: data });
  },
});

mcpServer.tool("scheduler_end_focus", {
  description: "End a focus session.",
  inputSchema: { type: "object", properties: { session_id: { type: "string" }, status: { type: "string" } }, required: ["session_id"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("focus_sessions")
      .update({ status: params.status || "completed", ended_at: new Date().toISOString() })
      .eq("id", params.session_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: `Focus session ${params.status || "completed"}`, session: data });
  },
});

mcpServer.tool("scheduler_list_focus_sessions", {
  description: "List recent focus sessions.",
  inputSchema: { type: "object", properties: { days: { type: "number" }, status: { type: "string" } } },
  handler: async (params: any) => {
    const since = new Date(Date.now() - (params.days || 7) * 86400000).toISOString();
    let q = db().from("focus_sessions").select("*").eq("user_id", uid()).gte("started_at", since).order("started_at", { ascending: false });
    if (params.status) q = q.eq("status", params.status);
    const { data, error } = await q;
    if (error) return err(error.message);
    const totalMin = (data ?? []).filter((s: any) => s.status === "completed").reduce((a: number, s: any) => a + s.duration_minutes, 0);
    return ok({ count: data?.length ?? 0, total_focus_minutes: totalMin, sessions: data });
  },
});

// ─── SYSTEMS ────────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_systems", {
  description: "List recurring systems/routines.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data, error } = await db().from("systems").select("*").eq("user_id", uid()).order("name");
    if (error) return err(error.message);
    return ok({ systems: data });
  },
});

mcpServer.tool("scheduler_create_system", {
  description: "Create a recurring system.",
  inputSchema: { type: "object", properties: {
    name: { type: "string" }, calendar_id: { type: "string" }, recurrence_type: { type: "string" },
    recurrence_days: { type: "array", items: { type: "number" } },
    default_duration_minutes: { type: "number" }, default_start_time: { type: "string" },
  }, required: ["name", "calendar_id"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("systems").insert({
      user_id: uid(), calendar_id: params.calendar_id, name: params.name,
      recurrence_type: params.recurrence_type ?? "weekly",
      recurrence_days: params.recurrence_days ?? [1, 2, 3, 4, 5],
      default_duration_minutes: params.default_duration_minutes ?? 60,
      default_start_time: params.default_start_time ?? null,
      is_active: true, checklist_items: [], generation_horizon_days: 14,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "System created", system: data });
  },
});

// ─── TEMPLATES ──────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_templates", {
  description: "List event templates.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data, error } = await db().from("event_templates").select("*").eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ templates: data });
  },
});

mcpServer.tool("scheduler_create_from_template", {
  description: "Create event from a template.",
  inputSchema: { type: "object", properties: { template_id: { type: "string" }, start_time: { type: "string" } }, required: ["template_id", "start_time"] },
  handler: async (params: any) => {
    const { data: tpl, error: tErr } = await db().from("event_templates").select("*")
      .eq("id", params.template_id).eq("user_id", uid()).single();
    if (tErr || !tpl) return err("Template not found.");
    const startDate = new Date(params.start_time);
    const endDate = new Date(startDate.getTime() + tpl.duration_minutes * 60000);
    const calId = tpl.calendar_id || (await db().from("calendars").select("id").eq("user_id", uid()).limit(1).then((r: any) => r.data?.[0]?.id));
    const { data, error } = await db().from("events").insert({
      user_id: uid(), calendar_id: calId, title: tpl.title, description: tpl.description,
      location: tpl.location, start_time: startDate.toISOString(), end_time: endDate.toISOString(),
      is_all_day: tpl.is_all_day, is_system_generated: false, is_customized: false,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Event created from template", event: data });
  },
});

// ─── TAGS ───────────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_tags", {
  description: "List all tags.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const { data, error } = await db().from("tags").select("*").eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ tags: data });
  },
});

mcpServer.tool("scheduler_create_tag", {
  description: "Create a tag.",
  inputSchema: { type: "object", properties: { name: { type: "string" }, color: { type: "string" } }, required: ["name"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("tags").insert({
      user_id: uid(), name: params.name, color: params.color ?? "#6366f1",
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Tag created", tag: data });
  },
});

// ─── ANALYTICS ──────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_get_analytics", {
  description: "Get productivity analytics.",
  inputSchema: { type: "object", properties: { days: { type: "number" } } },
  handler: async (params: any) => {
    const since = new Date(Date.now() - (params.days || 7) * 86400000).toISOString().slice(0, 10);
    const { data, error } = await db().from("daily_scores").select("*")
      .eq("user_id", uid()).gte("score_date", since).order("score_date", { ascending: false });
    if (error) return err(error.message);
    const scores = data ?? [];
    const avgScore = scores.length ? scores.reduce((a: number, s: any) => a + s.score, 0) / scores.length : 0;
    return ok({
      days: scores.length, average_score: Math.round(avgScore * 10) / 10,
      total_focus_minutes: scores.reduce((a: number, s: any) => a + s.focus_minutes, 0),
      total_completed_events: scores.reduce((a: number, s: any) => a + s.completed_events, 0),
      daily_scores: scores,
    });
  },
});

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

mcpServer.tool("scheduler_dashboard", {
  description: "Full dashboard: today's events, goals, mood, focus, scores.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const [events, goals, journal, focus, scores] = await Promise.all([
      db().from("events").select("id,title,start_time,end_time,is_all_day").eq("user_id", uid())
        .gte("start_time", `${today}T00:00:00`).lte("start_time", `${today}T23:59:59`).order("start_time"),
      db().from("goals").select("id,title,status,progress,target_date").eq("user_id", uid()).eq("status", "active"),
      db().from("journal_entries").select("date,mood,energy").eq("user_id", uid()).gte("date", weekAgo).order("date", { ascending: false }).limit(7),
      db().from("focus_sessions").select("duration_minutes,status").eq("user_id", uid()).gte("started_at", `${weekAgo}T00:00:00`).eq("status", "completed"),
      db().from("daily_scores").select("score,score_date").eq("user_id", uid()).gte("score_date", weekAgo).order("score_date", { ascending: false }),
    ]);
    const focusTotal = (focus.data ?? []).reduce((a: number, s: any) => a + s.duration_minutes, 0);
    const avgScore = (scores.data?.length ?? 0) > 0 ? scores.data!.reduce((a: number, s: any) => a + s.score, 0) / scores.data!.length : 0;
    return ok({
      today, events_today: events.data?.length ?? 0, events: events.data,
      active_goals: goals.data?.length ?? 0, goals: goals.data,
      recent_moods: journal.data?.map((j: any) => ({ date: j.date, mood: j.mood, energy: j.energy })),
      week_focus_minutes: focusTotal, week_avg_score: Math.round(avgScore * 10) / 10,
    });
  },
});

// ─── EVENT CHECKLIST ────────────────────────────────────────────────────────

mcpServer.tool("scheduler_list_checklist", {
  description: "Get checklist items for an event.",
  inputSchema: { type: "object", properties: { event_id: { type: "string" } }, required: ["event_id"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("event_checklist_items").select("*")
      .eq("event_id", params.event_id).eq("user_id", uid()).order("sort_order");
    if (error) return err(error.message);
    return ok({ items: data });
  },
});

mcpServer.tool("scheduler_toggle_checklist", {
  description: "Toggle a checklist item.",
  inputSchema: { type: "object", properties: { item_id: { type: "string" }, is_completed: { type: "boolean" } }, required: ["item_id", "is_completed"] },
  handler: async (params: any) => {
    const { data, error } = await db().from("event_checklist_items")
      .update({ is_completed: params.is_completed })
      .eq("id", params.item_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Checklist updated", item: data });
  },
});

// ─── HTTP Transport ─────────────────────────────────────────────────────────

const transport = new StreamableHttpTransport();
const httpHandler = transport.bind(mcpServer);

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    currentUserId = c.req.header("x-scheduler-user-id") || "";
  } catch {
    currentUserId = "";
  }
  await next();
});

app.all("/*", async (c) => {
  const response = await httpHandler(c.req.raw);
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
});

Deno.serve(app.fetch);
