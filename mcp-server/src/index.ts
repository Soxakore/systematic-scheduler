#!/usr/bin/env node
/**
 * Systematic Scheduler MCP Server
 * Exposes calendar, goals, journal, vision board, focus sessions,
 * systems, templates, tags, and analytics to any MCP-compatible AI.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getSupabase, getUserId } from "./supabase.js";

const server = new McpServer({
  name: "systematic-scheduler-mcp-server",
  version: "1.0.0",
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string) {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }] };
}
function db() { return getSupabase(); }
function uid() { return getUserId(); }

// ─── CALENDAR EVENTS ────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_list_events",
  {
    title: "List Calendar Events",
    description: "List calendar events in a date range. Returns upcoming events by default.",
    inputSchema: {
      start_date: z.string().optional().describe("ISO date string for range start (default: today)"),
      end_date: z.string().optional().describe("ISO date string for range end (default: +30 days)"),
      calendar_id: z.string().uuid().optional().describe("Filter by calendar ID"),
      limit: z.number().int().min(1).max(200).default(50).describe("Max results"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const now = new Date();
    const start = params.start_date || now.toISOString();
    const end = params.end_date || new Date(now.getTime() + 30 * 86400000).toISOString();
    let q = db().from("events").select("*")
      .eq("user_id", uid())
      .gte("start_time", start)
      .lte("start_time", end)
      .order("start_time")
      .limit(params.limit);
    if (params.calendar_id) q = q.eq("calendar_id", params.calendar_id);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok({ count: data?.length ?? 0, events: data });
  }
);

server.registerTool(
  "scheduler_search_events",
  {
    title: "Search Events",
    description: "Search events by title or description text.",
    inputSchema: {
      query: z.string().min(1).describe("Search text"),
      limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("events").select("*")
      .eq("user_id", uid())
      .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
      .order("start_time", { ascending: false })
      .limit(params.limit);
    if (error) return err(error.message);
    return ok({ count: data?.length ?? 0, events: data });
  }
);

server.registerTool(
  "scheduler_create_event",
  {
    title: "Create Calendar Event",
    description: "Create a new calendar event. Provide title, start/end time, and optionally calendar, location, description.",
    inputSchema: {
      title: z.string().min(1).describe("Event title"),
      start_time: z.string().describe("ISO datetime for event start"),
      end_time: z.string().describe("ISO datetime for event end"),
      calendar_id: z.string().uuid().optional().describe("Calendar to add to"),
      description: z.string().optional().describe("Event description"),
      location: z.string().optional().describe("Event location"),
      is_all_day: z.boolean().default(false).describe("All-day event?"),
      reminder_minutes: z.number().int().optional().describe("Reminder in minutes before"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params) => {
    // If no calendar_id, use first available
    let calId = params.calendar_id;
    if (!calId) {
      const { data: cals } = await db().from("calendars").select("id").eq("user_id", uid()).limit(1);
      calId = cals?.[0]?.id;
      if (!calId) return err("No calendars found. Create one first.");
    }
    const { data, error } = await db().from("events").insert({
      user_id: uid(),
      calendar_id: calId,
      title: params.title,
      start_time: params.start_time,
      end_time: params.end_time,
      description: params.description ?? null,
      location: params.location ?? null,
      is_all_day: params.is_all_day,
      reminder_minutes: params.reminder_minutes ?? null,
      is_system_generated: false,
      is_customized: false,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Event created", event: data });
  }
);

server.registerTool(
  "scheduler_update_event",
  {
    title: "Update Calendar Event",
    description: "Update an existing event by ID. Only pass fields you want to change.",
    inputSchema: {
      event_id: z.string().uuid().describe("Event ID to update"),
      title: z.string().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      is_all_day: z.boolean().optional(),
      reminder_minutes: z.number().int().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { event_id, ...updates } = params;
    const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    if (Object.keys(clean).length === 0) return err("No fields to update.");
    const { data, error } = await db().from("events")
      .update({ ...clean, updated_at: new Date().toISOString() })
      .eq("id", event_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Event updated", event: data });
  }
);

server.registerTool(
  "scheduler_delete_event",
  {
    title: "Delete Calendar Event",
    description: "Permanently delete a calendar event by ID.",
    inputSchema: { event_id: z.string().uuid().describe("Event ID to delete") },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { error } = await db().from("events").delete().eq("id", params.event_id).eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ message: "Event deleted" });
  }
);

// ─── CALENDARS ──────────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_list_calendars",
  {
    title: "List Calendars",
    description: "List all user calendars.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const { data, error } = await db().from("calendars").select("*").eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ calendars: data });
  }
);

// ─── GOALS ──────────────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_list_goals",
  {
    title: "List Goals",
    description: "List user goals, optionally filtered by status.",
    inputSchema: {
      status: z.enum(["active", "completed", "archived"]).optional().describe("Filter by status"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    let q = db().from("goals").select("*").eq("user_id", uid()).order("created_at", { ascending: false });
    if (params.status) q = q.eq("status", params.status);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok({ goals: data });
  }
);

server.registerTool(
  "scheduler_create_goal",
  {
    title: "Create Goal",
    description: "Create a new goal with title, description, optional target date.",
    inputSchema: {
      title: z.string().min(1).describe("Goal title"),
      description: z.string().default("").describe("Goal description"),
      target_date: z.string().optional().describe("Target date (ISO)"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("goals").insert({
      user_id: uid(),
      title: params.title,
      description: params.description,
      target_date: params.target_date ?? null,
      status: "active",
      progress: 0,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Goal created", goal: data });
  }
);

server.registerTool(
  "scheduler_update_goal",
  {
    title: "Update Goal",
    description: "Update goal fields — title, description, status, progress, target_date.",
    inputSchema: {
      goal_id: z.string().uuid().describe("Goal ID"),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["active", "completed", "archived"]).optional(),
      progress: z.number().min(0).max(100).optional(),
      target_date: z.string().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { goal_id, ...updates } = params;
    const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    const { data, error } = await db().from("goals")
      .update({ ...clean, updated_at: new Date().toISOString() })
      .eq("id", goal_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Goal updated", goal: data });
  }
);

server.registerTool(
  "scheduler_delete_goal",
  {
    title: "Delete Goal",
    description: "Delete a goal by ID.",
    inputSchema: { goal_id: z.string().uuid().describe("Goal ID") },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { error } = await db().from("goals").delete().eq("id", params.goal_id).eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ message: "Goal deleted" });
  }
);

// ─── JOURNAL ────────────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_get_journal",
  {
    title: "Get Journal Entry",
    description: "Get a journal entry for a specific date (YYYY-MM-DD). Returns null if none exists.",
    inputSchema: { date: z.string().describe("Date in YYYY-MM-DD format") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("journal_entries").select("*")
      .eq("user_id", uid()).eq("date", params.date).maybeSingle();
    if (error) return err(error.message);
    return ok({ entry: data });
  }
);

server.registerTool(
  "scheduler_list_journal",
  {
    title: "List Journal Entries",
    description: "List recent journal entries.",
    inputSchema: { days: z.number().int().min(1).max(365).default(30).describe("Number of past days") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const since = new Date(Date.now() - params.days * 86400000).toISOString().slice(0, 10);
    const { data, error } = await db().from("journal_entries").select("*")
      .eq("user_id", uid()).gte("date", since).order("date", { ascending: false });
    if (error) return err(error.message);
    return ok({ count: data?.length ?? 0, entries: data });
  }
);

server.registerTool(
  "scheduler_upsert_journal",
  {
    title: "Write Journal Entry",
    description: "Create or update a journal entry for a date. Merges with existing entry.",
    inputSchema: {
      date: z.string().describe("Date YYYY-MM-DD"),
      mood: z.number().int().min(1).max(5).optional().describe("Mood 1-5"),
      energy: z.number().int().min(1).max(5).optional().describe("Energy 1-5"),
      gratitude: z.array(z.string()).optional().describe("Gratitude items"),
      wins: z.array(z.string()).optional().describe("Today's wins"),
      lessons: z.array(z.string()).optional().describe("Lessons learned"),
      intentions: z.array(z.string()).optional().describe("Tomorrow's intentions"),
      free_text: z.string().optional().describe("Free-form text"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { date, ...fields } = params;
    const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    const { data, error } = await db().from("journal_entries").upsert({
      user_id: uid(),
      date,
      ...clean,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,date" }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Journal saved", entry: data });
  }
);

// ─── VISION BOARD ───────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_list_vision",
  {
    title: "List Vision Board Items",
    description: "List all vision board items.",
    inputSchema: {
      category: z.string().optional().describe("Filter by category"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    let q = db().from("vision_board_items").select("*").eq("user_id", uid()).order("sort_order");
    if (params.category) q = q.eq("category", params.category);
    const { data, error } = await q;
    if (error) return err(error.message);
    return ok({ items: data });
  }
);

server.registerTool(
  "scheduler_create_vision_item",
  {
    title: "Create Vision Board Item",
    description: "Add a new item to the vision board.",
    inputSchema: {
      title: z.string().min(1).describe("Item title"),
      description: z.string().default("").describe("Description"),
      category: z.string().default("general").describe("Category: career, health, relationships, finance, learning, travel, home, social, general"),
      color: z.string().default("#6366f1").describe("Hex color"),
      image_url: z.string().optional().describe("Image URL"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("vision_board_items").insert({
      user_id: uid(),
      title: params.title,
      description: params.description,
      category: params.category,
      color: params.color,
      icon: "star",
      position_x: 0, position_y: 0, width: 1, height: 1,
      image_url: params.image_url ?? null,
      is_achieved: false,
      sort_order: 0,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Vision item created", item: data });
  }
);

server.registerTool(
  "scheduler_update_vision_item",
  {
    title: "Update Vision Board Item",
    description: "Update a vision board item — mark achieved, change title, etc.",
    inputSchema: {
      item_id: z.string().uuid().describe("Item ID"),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      is_achieved: z.boolean().optional(),
      image_url: z.string().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { item_id, ...updates } = params;
    const clean: Record<string, unknown> = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (clean.is_achieved === true) clean.achieved_at = new Date().toISOString();
    clean.updated_at = new Date().toISOString();
    const { data, error } = await db().from("vision_board_items")
      .update(clean).eq("id", item_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Vision item updated", item: data });
  }
);

server.registerTool(
  "scheduler_delete_vision_item",
  {
    title: "Delete Vision Board Item",
    description: "Delete a vision board item.",
    inputSchema: { item_id: z.string().uuid().describe("Item ID") },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { error } = await db().from("vision_board_items").delete().eq("id", params.item_id).eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ message: "Vision item deleted" });
  }
);

// ─── FOCUS SESSIONS ─────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_start_focus",
  {
    title: "Start Focus Session",
    description: "Start a new focus/deep-work session. Optionally linked to an event.",
    inputSchema: {
      duration_minutes: z.number().int().min(1).max(480).describe("Planned duration in minutes"),
      event_id: z.string().uuid().optional().describe("Link to a calendar event"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("focus_sessions").insert({
      user_id: uid(),
      event_id: params.event_id ?? null,
      duration_minutes: params.duration_minutes,
      started_at: new Date().toISOString(),
      status: "active",
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Focus session started", session: data });
  }
);

server.registerTool(
  "scheduler_end_focus",
  {
    title: "End Focus Session",
    description: "End an active focus session.",
    inputSchema: {
      session_id: z.string().uuid().describe("Focus session ID"),
      status: z.enum(["completed", "cancelled"]).default("completed").describe("How did it end?"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("focus_sessions")
      .update({ status: params.status, ended_at: new Date().toISOString() })
      .eq("id", params.session_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: `Focus session ${params.status}`, session: data });
  }
);

server.registerTool(
  "scheduler_list_focus_sessions",
  {
    title: "List Focus Sessions",
    description: "List recent focus sessions.",
    inputSchema: {
      days: z.number().int().min(1).max(90).default(7).describe("Past N days"),
      status: z.enum(["active", "completed", "cancelled"]).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const since = new Date(Date.now() - params.days * 86400000).toISOString();
    let q = db().from("focus_sessions").select("*")
      .eq("user_id", uid()).gte("started_at", since).order("started_at", { ascending: false });
    if (params.status) q = q.eq("status", params.status);
    const { data, error } = await q;
    if (error) return err(error.message);
    const totalMin = (data ?? []).filter(s => s.status === "completed").reduce((a: number, s: { duration_minutes: number }) => a + s.duration_minutes, 0);
    return ok({ count: data?.length ?? 0, total_focus_minutes: totalMin, sessions: data });
  }
);

// ─── SYSTEMS (Recurring routines) ───────────────────────────────────────────

server.registerTool(
  "scheduler_list_systems",
  {
    title: "List Systems",
    description: "List all recurring systems/routines.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const { data, error } = await db().from("systems").select("*").eq("user_id", uid()).order("name");
    if (error) return err(error.message);
    return ok({ systems: data });
  }
);

server.registerTool(
  "scheduler_create_system",
  {
    title: "Create System",
    description: "Create a recurring routine/system.",
    inputSchema: {
      name: z.string().min(1).describe("System name"),
      calendar_id: z.string().uuid().describe("Calendar to generate events in"),
      recurrence_type: z.enum(["daily", "weekly", "custom"]).default("weekly"),
      recurrence_days: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]).describe("Days of week (0=Sun)"),
      default_duration_minutes: z.number().int().min(5).max(480).default(60),
      default_start_time: z.string().optional().describe("Default time HH:MM"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("systems").insert({
      user_id: uid(),
      calendar_id: params.calendar_id,
      name: params.name,
      recurrence_type: params.recurrence_type,
      recurrence_days: params.recurrence_days,
      default_duration_minutes: params.default_duration_minutes,
      default_start_time: params.default_start_time ?? null,
      is_active: true,
      checklist_items: [],
      generation_horizon_days: 14,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "System created", system: data });
  }
);

// ─── TEMPLATES ──────────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_list_templates",
  {
    title: "List Event Templates",
    description: "List saved event templates for quick event creation.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const { data, error } = await db().from("event_templates").select("*").eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ templates: data });
  }
);

server.registerTool(
  "scheduler_create_from_template",
  {
    title: "Create Event from Template",
    description: "Create a calendar event using a saved template. Just provide the date/time.",
    inputSchema: {
      template_id: z.string().uuid().describe("Template ID"),
      start_time: z.string().describe("ISO datetime for event start"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params) => {
    const { data: tpl, error: tErr } = await db().from("event_templates").select("*")
      .eq("id", params.template_id).eq("user_id", uid()).single();
    if (tErr || !tpl) return err("Template not found.");
    const startDate = new Date(params.start_time);
    const endDate = new Date(startDate.getTime() + tpl.duration_minutes * 60000);
    const { data, error } = await db().from("events").insert({
      user_id: uid(),
      calendar_id: tpl.calendar_id || (await db().from("calendars").select("id").eq("user_id", uid()).limit(1).then(r => r.data?.[0]?.id)),
      title: tpl.title,
      description: tpl.description,
      location: tpl.location,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      is_all_day: tpl.is_all_day,
      is_system_generated: false,
      is_customized: false,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Event created from template", event: data });
  }
);

// ─── TAGS ───────────────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_list_tags",
  {
    title: "List Tags",
    description: "List all user tags for categorizing events.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const { data, error } = await db().from("tags").select("*").eq("user_id", uid());
    if (error) return err(error.message);
    return ok({ tags: data });
  }
);

server.registerTool(
  "scheduler_create_tag",
  {
    title: "Create Tag",
    description: "Create a new tag.",
    inputSchema: {
      name: z.string().min(1).describe("Tag name"),
      color: z.string().default("#6366f1").describe("Hex color"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("tags").insert({
      user_id: uid(), name: params.name, color: params.color,
    }).select().single();
    if (error) return err(error.message);
    return ok({ message: "Tag created", tag: data });
  }
);

// ─── ANALYTICS / DAILY SCORES ───────────────────────────────────────────────

server.registerTool(
  "scheduler_get_analytics",
  {
    title: "Get Analytics",
    description: "Get daily productivity scores and stats for a date range.",
    inputSchema: {
      days: z.number().int().min(1).max(365).default(7).describe("Past N days"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const since = new Date(Date.now() - params.days * 86400000).toISOString().slice(0, 10);
    const { data, error } = await db().from("daily_scores").select("*")
      .eq("user_id", uid()).gte("score_date", since).order("score_date", { ascending: false });
    if (error) return err(error.message);
    const scores = data ?? [];
    const avgScore = scores.length ? scores.reduce((a, s) => a + s.score, 0) / scores.length : 0;
    const totalFocus = scores.reduce((a, s) => a + s.focus_minutes, 0);
    const totalCompleted = scores.reduce((a, s) => a + s.completed_events, 0);
    return ok({
      days: scores.length,
      average_score: Math.round(avgScore * 10) / 10,
      total_focus_minutes: totalFocus,
      total_completed_events: totalCompleted,
      daily_scores: scores,
    });
  }
);

// ─── DASHBOARD SUMMARY ─────────────────────────────────────────────────────

server.registerTool(
  "scheduler_dashboard",
  {
    title: "Dashboard Summary",
    description: "Get a comprehensive overview: today's events, active goals, recent journal mood, focus stats, upcoming deadlines. Perfect for morning briefings.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const [events, goals, journal, focus, scores] = await Promise.all([
      db().from("events").select("id,title,start_time,end_time,is_all_day").eq("user_id", uid())
        .gte("start_time", todayStart).lte("start_time", todayEnd).order("start_time"),
      db().from("goals").select("id,title,status,progress,target_date").eq("user_id", uid()).eq("status", "active"),
      db().from("journal_entries").select("date,mood,energy").eq("user_id", uid())
        .gte("date", weekAgo).order("date", { ascending: false }).limit(7),
      db().from("focus_sessions").select("duration_minutes,status").eq("user_id", uid())
        .gte("started_at", `${weekAgo}T00:00:00`).eq("status", "completed"),
      db().from("daily_scores").select("score,score_date").eq("user_id", uid())
        .gte("score_date", weekAgo).order("score_date", { ascending: false }),
    ]);

    const focusTotal = (focus.data ?? []).reduce((a, s) => a + s.duration_minutes, 0);
    const avgScore = (scores.data?.length ?? 0) > 0
      ? scores.data!.reduce((a, s) => a + s.score, 0) / scores.data!.length : 0;

    return ok({
      today: today,
      events_today: events.data?.length ?? 0,
      events: events.data,
      active_goals: goals.data?.length ?? 0,
      goals: goals.data,
      recent_moods: journal.data?.map(j => ({ date: j.date, mood: j.mood, energy: j.energy })),
      week_focus_minutes: focusTotal,
      week_avg_score: Math.round(avgScore * 10) / 10,
    });
  }
);

// ─── EVENT CHECKLIST ────────────────────────────────────────────────────────

server.registerTool(
  "scheduler_list_checklist",
  {
    title: "List Event Checklist",
    description: "Get checklist items for a specific event.",
    inputSchema: { event_id: z.string().uuid().describe("Event ID") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("event_checklist_items").select("*")
      .eq("event_id", params.event_id).eq("user_id", uid()).order("sort_order");
    if (error) return err(error.message);
    return ok({ items: data });
  }
);

server.registerTool(
  "scheduler_toggle_checklist",
  {
    title: "Toggle Checklist Item",
    description: "Toggle a checklist item's completion status.",
    inputSchema: {
      item_id: z.string().uuid().describe("Checklist item ID"),
      is_completed: z.boolean().describe("New completion status"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params) => {
    const { data, error } = await db().from("event_checklist_items")
      .update({ is_completed: params.is_completed })
      .eq("id", params.item_id).eq("user_id", uid()).select().single();
    if (error) return err(error.message);
    return ok({ message: "Checklist updated", item: data });
  }
);

// ─── BOOT ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Systematic Scheduler MCP server running via stdio");
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
