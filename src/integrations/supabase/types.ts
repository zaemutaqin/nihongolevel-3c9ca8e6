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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          error_code: string | null
          event_type: string
          id: number
          input_length: number | null
          ip_address: string | null
          metadata: Json
          success: boolean
          ts: string
          user_id: string | null
        }
        Insert: {
          error_code?: string | null
          event_type: string
          id?: number
          input_length?: number | null
          ip_address?: string | null
          metadata?: Json
          success?: boolean
          ts?: string
          user_id?: string | null
        }
        Update: {
          error_code?: string | null
          event_type?: string
          id?: number
          input_length?: number | null
          ip_address?: string | null
          metadata?: Json
          success?: boolean
          ts?: string
          user_id?: string | null
        }
        Relationships: []
      }
      guest_rate_limits: {
        Row: {
          count: number
          day: string
          ip: string
          updated_at: string
        }
        Insert: {
          count?: number
          day?: string
          ip: string
          updated_at?: string
        }
        Update: {
          count?: number
          day?: string
          ip?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          completed: boolean
          confidence_score: number | null
          created_at: string
          grammar_score: number | null
          id: string
          naturalness_score: number | null
          scenario_id: string
          scenario_title: string
          suggestions: Json | null
          summary: string | null
          transcript: Json
          updated_at: string
          user_id: string
          vocabulary_level: string | null
        }
        Insert: {
          completed?: boolean
          confidence_score?: number | null
          created_at?: string
          grammar_score?: number | null
          id?: string
          naturalness_score?: number | null
          scenario_id: string
          scenario_title: string
          suggestions?: Json | null
          summary?: string | null
          transcript?: Json
          updated_at?: string
          user_id: string
          vocabulary_level?: string | null
        }
        Update: {
          completed?: boolean
          confidence_score?: number | null
          created_at?: string
          grammar_score?: number | null
          id?: string
          naturalness_score?: number | null
          scenario_id?: string
          scenario_title?: string
          suggestions?: Json | null
          summary?: string | null
          transcript?: Json
          updated_at?: string
          user_id?: string
          vocabulary_level?: string | null
        }
        Relationships: []
      }
      item_progress: {
        Row: {
          correct_streak: number
          created_at: string
          ease_factor: number
          id: string
          item_id: string
          last_seen_at: string | null
          next_review_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_streak?: number
          created_at?: string
          ease_factor?: number
          id?: string
          item_id: string
          last_seen_at?: string | null
          next_review_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_streak?: number
          created_at?: string
          ease_factor?: number
          id?: string
          item_id?: string
          last_seen_at?: string | null
          next_review_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "learning_items"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_items: {
        Row: {
          audio_url: string | null
          content_jp: string
          content_meaning: string | null
          content_romaji: string | null
          created_at: string
          id: string
          session_id: string
          type: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          content_jp: string
          content_meaning?: string | null
          content_romaji?: string | null
          created_at?: string
          id: string
          session_id: string
          type: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          content_jp?: string
          content_meaning?: string | null
          content_romaji?: string | null
          created_at?: string
          id?: string
          session_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          unlock_threshold_pct: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          order_index?: number
          unlock_threshold_pct?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          unlock_threshold_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      nihongo_data: {
        Row: {
          data: Json
          item_id: number
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data: Json
          item_id: number
          kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          item_id?: number
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_level_id: string | null
          email: string | null
          full_name: string | null
          id: string
          is_pro: boolean
          onboarding_level: string | null
          onboarding_location: string | null
          pro_activated_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_level_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_pro?: boolean
          onboarding_level?: string | null
          onboarding_location?: string | null
          pro_activated_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_level_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_pro?: boolean
          onboarding_level?: string | null
          onboarding_location?: string | null
          pro_activated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      session_attempts: {
        Row: {
          completed_at: string
          created_at: string
          duration_sec: number
          id: string
          score_pct: number
          session_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_sec?: number
          id?: string
          score_pct: number
          session_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_sec?: number
          id?: string
          score_pct?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          order_index: number
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          order_index?: number
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unit_completions: {
        Row: {
          best_score_pct: number
          completed_at: string
          created_at: string
          id: string
          passed: boolean
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score_pct?: number
          completed_at?: string
          created_at?: string
          id?: string
          passed?: boolean
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score_pct?: number
          completed_at?: string
          created_at?: string
          id?: string
          passed?: boolean
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_completions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          level_id: string
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          level_id: string
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string }
        Returns: boolean
      }
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
