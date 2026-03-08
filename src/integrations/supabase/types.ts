export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      calendar_shares: {
        Row: {
          calendar_id: string
          created_at: string
          id: string
          owner_id: string
          permission: string
          shared_with_email: string
          shared_with_id: string | null
          status: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          id?: string
          owner_id: string
          permission?: string
          shared_with_email: string
          shared_with_id?: string | null
          status?: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          permission?: string
          shared_with_email?: string
          shared_with_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_shares_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      calendars: {
        Row: {
          color: string
          created_at: string
          id: string
          is_visible: boolean
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_scores: {
        Row: {
          completed_events: number
          created_at: string
          focus_minutes: number
          id: string
          score: number
          score_date: string
          total_events: number
          user_id: string
        }
        Insert: {
          completed_events?: number
          created_at?: string
          focus_minutes?: number
          id?: string
          score?: number
          score_date: string
          total_events?: number
          user_id: string
        }
        Update: {
          completed_events?: number
          created_at?: string
          focus_minutes?: number
          id?: string
          score?: number
          score_date?: string
          total_events?: number
          user_id?: string
        }
        Relationships: []
      }
      event_checklist_items: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_completed: boolean
          sort_order: number
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_suggestions: {
        Row: {
          calendar_id: string | null
          created_at: string
          description: string | null
          end_time: string
          from_user_id: string
          id: string
          is_all_day: boolean
          location: string | null
          message: string | null
          start_time: string
          status: string
          title: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          from_user_id: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          message?: string | null
          start_time: string
          status?: string
          title: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          from_user_id?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          message?: string | null
          start_time?: string
          status?: string
          title?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_suggestions_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          event_id: string
          tag_id: string
        }
        Insert: {
          event_id: string
          tag_id: string
        }
        Update: {
          event_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          calendar_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_all_day: boolean
          location: string | null
          name: string
          title: string
          user_id: string
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_all_day?: boolean
          location?: string | null
          name: string
          title?: string
          user_id: string
        }
        Update: {
          calendar_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_all_day?: boolean
          location?: string | null
          name?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          calendar_id: string
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_all_day: boolean
          is_customized: boolean
          is_system_generated: boolean
          location: string | null
          reminder_minutes: number | null
          start_time: string
          system_id: string | null
          system_instance_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_all_day?: boolean
          is_customized?: boolean
          is_system_generated?: boolean
          location?: string | null
          reminder_minutes?: number | null
          start_time: string
          system_id?: string | null
          system_instance_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_all_day?: boolean
          is_customized?: boolean
          is_system_generated?: boolean
          location?: string | null
          reminder_minutes?: number | null
          start_time?: string
          system_id?: string | null
          system_instance_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          ended_at: string | null
          event_id: string | null
          id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          event_id?: string | null
          id?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          event_id?: string | null
          id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          progress: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          date: string
          energy: number | null
          free_text: string | null
          gratitude: string[] | null
          id: string
          intentions: string[] | null
          lessons: string[] | null
          mood: number | null
          updated_at: string
          user_id: string
          wins: string[] | null
        }
        Insert: {
          created_at?: string
          date: string
          energy?: number | null
          free_text?: string | null
          gratitude?: string[] | null
          id?: string
          intentions?: string[] | null
          lessons?: string[] | null
          mood?: number | null
          updated_at?: string
          user_id: string
          wins?: string[] | null
        }
        Update: {
          created_at?: string
          date?: string
          energy?: number | null
          free_text?: string | null
          gratitude?: string[] | null
          id?: string
          intentions?: string[] | null
          lessons?: string[] | null
          mood?: number | null
          updated_at?: string
          user_id?: string
          wins?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_view: string
          id: string
          name: string
          timezone: string
          updated_at: string
          week_start_day: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_view?: string
          id: string
          name?: string
          timezone?: string
          updated_at?: string
          week_start_day?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_view?: string
          id?: string
          name?: string
          timezone?: string
          updated_at?: string
          week_start_day?: number
        }
        Relationships: []
      }
      system_tags: {
        Row: {
          system_id: string
          tag_id: string
        }
        Insert: {
          system_id: string
          tag_id: string
        }
        Update: {
          system_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_tags_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          calendar_id: string
          checklist_items: Json | null
          created_at: string
          default_duration_minutes: number
          default_start_time: string | null
          generation_horizon_days: number
          id: string
          is_active: boolean
          name: string
          recurrence_days: number[] | null
          recurrence_type: string
          time_window: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_id: string
          checklist_items?: Json | null
          created_at?: string
          default_duration_minutes?: number
          default_start_time?: string | null
          generation_horizon_days?: number
          id?: string
          is_active?: boolean
          name: string
          recurrence_days?: number[] | null
          recurrence_type?: string
          time_window?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_id?: string
          checklist_items?: Json | null
          created_at?: string
          default_duration_minutes?: number
          default_start_time?: string | null
          generation_horizon_days?: number
          id?: string
          is_active?: boolean
          name?: string
          recurrence_days?: number[] | null
          recurrence_type?: string
          time_window?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "systems_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      vision_board_items: {
        Row: {
          achieved_at: string | null
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          height: number
          icon: string | null
          id: string
          image_url: string | null
          is_achieved: boolean
          position_x: number
          position_y: number
          sort_order: number
          title: string
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          achieved_at?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          height?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_achieved?: boolean
          position_x?: number
          position_y?: number
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
          width?: number
        }
        Update: {
          achieved_at?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          height?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_achieved?: boolean
          position_x?: number
          position_y?: number
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
