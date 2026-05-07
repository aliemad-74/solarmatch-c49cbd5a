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
      app_users: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          name: string
          phone: string
          report_limit: number
          reports_generated: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          name: string
          phone: string
          report_limit?: number
          reports_generated?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          name?: string
          phone?: string
          report_limit?: number
          reports_generated?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_email_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      lead_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          best_time: string
          created_at: string
          email: string
          estimated_cost: number | null
          estimated_savings: number | null
          id: string
          kw_installed: number | null
          location_name: string | null
          name: string
          phone: string
          preferred_contact: string
          rooftop_area: number | null
          status: string
        }
        Insert: {
          best_time?: string
          created_at?: string
          email: string
          estimated_cost?: number | null
          estimated_savings?: number | null
          id?: string
          kw_installed?: number | null
          location_name?: string | null
          name: string
          phone: string
          preferred_contact?: string
          rooftop_area?: number | null
          status?: string
        }
        Update: {
          best_time?: string
          created_at?: string
          email?: string
          estimated_cost?: number | null
          estimated_savings?: number | null
          id?: string
          kw_installed?: number | null
          location_name?: string | null
          name?: string
          phone?: string
          preferred_contact?: string
          rooftop_area?: number | null
          status?: string
        }
        Relationships: []
      }
      market_data: {
        Row: {
          created_at: string
          data: Json
          id: string
          scraped_at: string
          source_urls: string[] | null
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          scraped_at?: string
          source_urls?: string[] | null
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          scraped_at?: string
          source_urls?: string[] | null
          type?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          language: string | null
          os: string | null
          path: string
          referrer: string | null
          screen_size: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          os?: string | null
          path: string
          referrer?: string | null
          screen_size?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          os?: string | null
          path?: string
          referrer?: string | null
          screen_size?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agreed_at: string | null
          agreed_to_terms: boolean
          avatar_url: string | null
          created_at: string
          email: string
          extra_reports_balance: number
          id: string
          marketing_consent: boolean
          name: string
          phone: string | null
          profile_type: string
          report_limit: number
          reports_generated: number
          reports_used_this_month: number
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string
          subscription_type: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          agreed_at?: string | null
          agreed_to_terms?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          extra_reports_balance?: number
          id?: string
          marketing_consent?: boolean
          name: string
          phone?: string | null
          profile_type?: string
          report_limit?: number
          reports_generated?: number
          reports_used_this_month?: number
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string
          subscription_type?: string
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          agreed_at?: string | null
          agreed_to_terms?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          extra_reports_balance?: number
          id?: string
          marketing_consent?: boolean
          name?: string
          phone?: string | null
          profile_type?: string
          report_limit?: number
          reports_generated?: number
          reports_used_this_month?: number
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string
          subscription_type?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      registration_tracking: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          user_id?: string | null
        }
        Relationships: []
      }
      report_history: {
        Row: {
          auth_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          location_name: string | null
          system_size_kw: number | null
          user_id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          location_name?: string | null
          system_size_kw?: number | null
          user_id: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          location_name?: string | null
          system_size_kw?: number | null
          user_id?: string
        }
        Relationships: []
      }
      solar_assessments: {
        Row: {
          ai_confidence: string | null
          ai_recommendation: string | null
          annual_production: number | null
          annual_savings: number | null
          aqi: number | null
          aqi_value: number | null
          area_in_feddans: number | null
          building_type: string | null
          city: string | null
          cloud_cover: number | null
          co2_saved: number | null
          coverage_ratio: number | null
          created_at: string
          data_source: string | null
          dominant_pollutant: string | null
          dust_efficiency_loss: number | null
          elevation: number | null
          farm_mode: boolean | null
          feasibility: string | null
          formatted_address: string | null
          governorate: string | null
          id: string
          latitude: number
          longitude: number
          monthly_consumption: number | null
          payback_years: number | null
          pollen_dust_index: number | null
          pv_package: string | null
          rooftop_area: number | null
          soiling_loss_applied: number | null
          system_size_kw: number | null
          temperature: number | null
          total_cost: number | null
          user_id: string | null
          vision_confidence: string | null
          vision_obstacles_count: number | null
          vision_shading_level: string | null
          vision_usable_area_ratio: number | null
        }
        Insert: {
          ai_confidence?: string | null
          ai_recommendation?: string | null
          annual_production?: number | null
          annual_savings?: number | null
          aqi?: number | null
          aqi_value?: number | null
          area_in_feddans?: number | null
          building_type?: string | null
          city?: string | null
          cloud_cover?: number | null
          co2_saved?: number | null
          coverage_ratio?: number | null
          created_at?: string
          data_source?: string | null
          dominant_pollutant?: string | null
          dust_efficiency_loss?: number | null
          elevation?: number | null
          farm_mode?: boolean | null
          feasibility?: string | null
          formatted_address?: string | null
          governorate?: string | null
          id?: string
          latitude: number
          longitude: number
          monthly_consumption?: number | null
          payback_years?: number | null
          pollen_dust_index?: number | null
          pv_package?: string | null
          rooftop_area?: number | null
          soiling_loss_applied?: number | null
          system_size_kw?: number | null
          temperature?: number | null
          total_cost?: number | null
          user_id?: string | null
          vision_confidence?: string | null
          vision_obstacles_count?: number | null
          vision_shading_level?: string | null
          vision_usable_area_ratio?: number | null
        }
        Update: {
          ai_confidence?: string | null
          ai_recommendation?: string | null
          annual_production?: number | null
          annual_savings?: number | null
          aqi?: number | null
          aqi_value?: number | null
          area_in_feddans?: number | null
          building_type?: string | null
          city?: string | null
          cloud_cover?: number | null
          co2_saved?: number | null
          coverage_ratio?: number | null
          created_at?: string
          data_source?: string | null
          dominant_pollutant?: string | null
          dust_efficiency_loss?: number | null
          elevation?: number | null
          farm_mode?: boolean | null
          feasibility?: string | null
          formatted_address?: string | null
          governorate?: string | null
          id?: string
          latitude?: number
          longitude?: number
          monthly_consumption?: number | null
          payback_years?: number | null
          pollen_dust_index?: number | null
          pv_package?: string | null
          rooftop_area?: number | null
          soiling_loss_applied?: number | null
          system_size_kw?: number | null
          temperature?: number | null
          total_cost?: number | null
          user_id?: string | null
          vision_confidence?: string | null
          vision_obstacles_count?: number | null
          vision_shading_level?: string | null
          vision_usable_area_ratio?: number | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          category: string
          comment: string | null
          created_at: string
          id: string
          ip_hash: string | null
          metadata: Json | null
          page_context: string | null
          rating: number
          status: string
          user_id: string | null
        }
        Insert: {
          category?: string
          comment?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          page_context?: string | null
          rating: number
          status?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          comment?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          page_context?: string | null
          rating?: number
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          plan_interest: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          plan_interest?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          plan_interest?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_registration_allowed: {
        Args: { p_email: string; p_ip_address: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_public_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_registration: {
        Args: { p_ip_address: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
