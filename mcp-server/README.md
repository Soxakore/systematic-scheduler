# Systematic Scheduler — MCP Server

A local MCP (Model Context Protocol) server that lets any AI tool (Claude Desktop, Cursor, Windsurf, etc.) manage your calendar, goals, journal, habits, vision board, focus sessions, and more.

## 28 Tools Available

| Category | Tools |
|----------|-------|
| **Calendar** | list_events, search_events, create_event, update_event, delete_event |
| **Calendars** | list_calendars |
| **Goals** | list_goals, create_goal, update_goal, delete_goal |
| **Journal** | get_journal, list_journal, upsert_journal |
| **Vision Board** | list_vision, create_vision_item, update_vision_item, delete_vision_item |
| **Focus** | start_focus, end_focus, list_focus_sessions |
| **Systems** | list_systems, create_system |
| **Templates** | list_templates, create_from_template |
| **Tags** | list_tags, create_tag |
| **Analytics** | get_analytics |
| **Dashboard** | dashboard (full morning briefing) |
| **Checklists** | list_checklist, toggle_checklist |

## Quick Setup

### 1. Build
```bash
cd mcp-server
npm install
npm run build
```

### 2. Environment Variables
You need three env vars:
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase **service role** key (not anon)
- `SCHEDULER_USER_ID` — your user's UUID from Supabase Auth

### 3. Claude Desktop Config
Add this to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "systematic-scheduler": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/systematic-scheduler/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://YOUR_PROJECT.supabase.co",
        "SUPABASE_SERVICE_KEY": "eyJ...",
        "SCHEDULER_USER_ID": "your-user-uuid"
      }
    }
  }
}
```

### 4. Restart Claude Desktop
After saving the config, restart Claude Desktop. You'll see the tools appear in the tool list.

## Usage Examples

- "What's on my calendar this week?"
- "Add a meeting with John tomorrow at 2pm for 1 hour"
- "Show me my active goals"
- "Write today's journal entry: Had a productive day shipping the MCP server"
- "Start a 25-minute focus session on the scheduler project"
- "Give me my morning dashboard briefing"

## For Other AI Tools

Any MCP-compatible client can use this server via stdio transport. Point it to `node dist/index.js` with the required env vars.
