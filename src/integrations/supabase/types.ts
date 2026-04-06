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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          accessed_by: string
          accessor_id: string | null
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          accessed_by: string
          accessor_id?: string | null
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          accessed_by?: string
          accessor_id?: string | null
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feature_toggles: {
        Row: {
          category: string
          config: Json | null
          created_at: string
          enabled: boolean
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          category?: string
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_blocks: {
        Row: {
          block_type: string
          config: Json
          created_at: string
          id: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          block_type?: string
          config?: Json
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          block_type?: string
          config?: Json
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      meditations: {
        Row: {
          created_at: string
          description: string
          id: string
          media_type: string
          media_url: string
          published: boolean
          sort_order: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          media_type?: string
          media_url?: string
          published?: boolean
          sort_order?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          media_type?: string
          media_url?: string
          published?: boolean
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_system: boolean | null
          reply_count: number | null
          role: string
          source: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean | null
          reply_count?: number | null
          role: string
          source?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean | null
          reply_count?: number | null
          role?: string
          source?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_summaries: {
        Row: {
          created_at: string
          id: string
          month_end: string
          month_start: string
          summary_text: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          month_end: string
          month_start: string
          summary_text: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          month_end?: string
          month_start?: string
          summary_text?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          id: string
          mood: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount_ils: number
          contact_email: string
          contact_name: string | null
          created_at: string
          id: string
          linked_therapist_id: string | null
          message: string | null
          payment_provider: string
          role: Database["public"]["Enums"]["access_role"]
          status: Database["public"]["Enums"]["payment_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ils: number
          contact_email: string
          contact_name?: string | null
          created_at?: string
          id?: string
          linked_therapist_id?: string | null
          message?: string | null
          payment_provider?: string
          role: Database["public"]["Enums"]["access_role"]
          status?: Database["public"]["Enums"]["payment_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ils?: number
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          linked_therapist_id?: string | null
          message?: string | null
          payment_provider?: string
          role?: Database["public"]["Enums"]["access_role"]
          status?: Database["public"]["Enums"]["payment_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_premium: boolean
          paypal_email: string | null
          paypal_transaction_id: string | null
          subscription_status: string
          subscription_tier: string
          trial_end_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean
          paypal_email?: string | null
          paypal_transaction_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_end_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_premium?: boolean
          paypal_email?: string | null
          paypal_transaction_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_end_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pwa_installations: {
        Row: {
          created_at: string
          id: string
          installed_at: string
          platform: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          installed_at?: string
          platform?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paypal_subscription_id: string | null
          plan_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paypal_subscription_id?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paypal_subscription_id?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      summary_logs: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          error_message: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          status: string
          user_id: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      system_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      therapist_patient_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          message_type: string
          patient_id: string
          therapist_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          message_type?: string
          patient_id: string
          therapist_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          message_type?: string
          patient_id?: string
          therapist_id?: string
          title?: string
        }
        Relationships: []
      }
      therapist_patients: {
        Row: {
          connected_at: string | null
          created_at: string
          id: string
          invite_code: string
          invite_created_at: string
          patient_id: string | null
          patient_name: string | null
          status: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          id?: string
          invite_code: string
          invite_created_at?: string
          patient_id?: string | null
          patient_name?: string | null
          status?: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          invite_created_at?: string
          patient_id?: string | null
          patient_name?: string | null
          status?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      therapist_registrations: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          license_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialization: string
          status: string | null
          user_id: string | null
          years_of_experience: number
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          license_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization: string
          status?: string | null
          user_id?: string | null
          years_of_experience: number
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          license_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string
          status?: string | null
          user_id?: string | null
          years_of_experience?: number
        }
        Relationships: []
      }
      user_access_statuses: {
        Row: {
          created_at: string
          id: string
          linked_therapist_id: string | null
          payment_status: Database["public"]["Enums"]["access_payment_status"]
          registration_date: string
          role: Database["public"]["Enums"]["access_role"]
          therapist_code: string | null
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_therapist_id?: string | null
          payment_status?: Database["public"]["Enums"]["access_payment_status"]
          registration_date?: string
          role: Database["public"]["Enums"]["access_role"]
          therapist_code?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_therapist_id?: string | null
          payment_status?: Database["public"]["Enums"]["access_payment_status"]
          registration_date?: string
          role?: Database["public"]["Enums"]["access_role"]
          therapist_code?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          last_summary_generated: string | null
          summary_day: string
          summary_focus: string[] | null
          summary_time: string
          summary_timezone: string
          therapy_type: string | null
          updated_at: string
          user_id: string
          weekly_summary_enabled: boolean | null
          weekly_summary_last_sent_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_summary_generated?: string | null
          summary_day?: string
          summary_focus?: string[] | null
          summary_time?: string
          summary_timezone?: string
          therapy_type?: string | null
          updated_at?: string
          user_id: string
          weekly_summary_enabled?: boolean | null
          weekly_summary_last_sent_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_summary_generated?: string | null
          summary_day?: string
          summary_focus?: string[] | null
          summary_time?: string
          summary_timezone?: string
          therapy_type?: string | null
          updated_at?: string
          user_id?: string
          weekly_summary_enabled?: boolean | null
          weekly_summary_last_sent_at?: string | null
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
      weekly_emotion_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          summary_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          summary_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          summary_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_emotion_ratings_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "weekly_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_questionnaires: {
        Row: {
          created_at: string
          id: string
          q1_feeling_vs_last_week: number
          q2_stress_level: number
          q3_clarity: number
          q4_coping_ability: number
          q5_weekly_feeling: number
          q6_next_week_outlook: number
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          q1_feeling_vs_last_week: number
          q2_stress_level: number
          q3_clarity: number
          q4_coping_ability: number
          q5_weekly_feeling: number
          q6_next_week_outlook: number
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          q1_feeling_vs_last_week?: number
          q2_stress_level?: number
          q3_clarity?: number
          q4_coping_ability?: number
          q5_weekly_feeling?: number
          q6_next_week_outlook?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          created_at: string
          id: string
          summary_text: string
          user_id: string
          viewed_at: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary_text: string
          user_id: string
          viewed_at?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          summary_text?: string
          user_id?: string
          viewed_at?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_review_therapist_registration: {
        Args: { p_approve: boolean; p_registration_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          reviewed_at: string
          reviewed_by: string
          status: string
          user_id: string
        }[]
      }
      admin_set_user_payment_status: {
        Args: {
          p_payment_status: Database["public"]["Enums"]["access_payment_status"]
          p_user_id: string
        }
        Returns: {
          payment_status: Database["public"]["Enums"]["access_payment_status"]
          updated_at: string
          user_id: string
        }[]
      }
      claim_therapist_invite: {
        Args: { p_invite_code: string }
        Returns: {
          connection_id: string
          therapist_id: string
        }[]
      }
      create_therapist_invite: {
        Args: never
        Returns: {
          invite_code: string
          invite_id: string
        }[]
      }
      generate_secure_invite_code: { Args: never; Returns: string }
      generate_unique_therapist_code: { Args: never; Returns: string }
      get_admin_all_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
      get_admin_push_subscription_count: { Args: never; Returns: number }
      get_admin_push_subscriptions: {
        Args: never
        Returns: {
          created_at: string
          id: string
          user_id: string
        }[]
      }
      get_admin_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_my_access_state: {
        Args: never
        Returns: {
          can_submit_payment_request: boolean
          covered_by_therapist: boolean
          effective_payment_status: Database["public"]["Enums"]["access_payment_status"]
          is_locked: boolean
          linked_therapist_id: string
          lock_message: string
          registration_date: string
          role: Database["public"]["Enums"]["access_role"]
          stored_payment_status: Database["public"]["Enums"]["access_payment_status"]
          therapist_code: string
          trial_ends_at: string
          user_id: string
        }[]
      }
      get_therapist_patient_insights: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      get_therapist_patient_summaries: {
        Args: { p_patient_id: string }
        Returns: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          summary_text: string
          summary_type: string
          viewed_at: string
        }[]
      }
      get_therapist_patients_dashboard: {
        Args: never
        Returns: {
          connected_at: string
          connection_id: string
          engagement_score: number
          invite_code: string
          monthly_summary_count: number
          patient_id: string
          patient_name: string
          recent_activity_at: string
          weekly_summary_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_user_access: {
        Args: {
          p_role: Database["public"]["Enums"]["access_role"]
          p_therapist_code?: string
        }
        Returns: {
          linked_therapist_id: string
          payment_status: Database["public"]["Enums"]["access_payment_status"]
          role: Database["public"]["Enums"]["access_role"]
          therapist_code: string
          trial_ends_at: string
          user_id: string
        }[]
      }
      is_approved_therapist: { Args: { _user_id: string }; Returns: boolean }
      log_admin_access: {
        Args: {
          p_accessed_by?: string
          p_accessor_id?: string
          p_action_type: string
          p_details?: Json
          p_record_id?: string
          p_table_name: string
          p_user_id?: string
        }
        Returns: string
      }
      send_therapist_patient_message: {
        Args: {
          p_body: string
          p_link?: string
          p_message_type?: string
          p_patient_id: string
          p_title: string
        }
        Returns: string
      }
      submit_payment_request: {
        Args: { p_contact_name?: string; p_message?: string }
        Returns: {
          amount_ils: number
          created_at: string
          id: string
          status: Database["public"]["Enums"]["payment_request_status"]
        }[]
      }
      submit_therapist_registration: {
        Args: {
          p_email: string
          p_full_name: string
          p_license_number?: string
          p_specialization: string
          p_years_of_experience: number
        }
        Returns: {
          created_at: string
          id: string
          reviewed_at: string
          status: string
        }[]
      }
    }
    Enums: {
      access_payment_status: "trial" | "active" | "locked"
      access_role: "therapist" | "patient"
      app_role: "admin" | "user" | "therapist"
      payment_request_status: "pending" | "approved" | "rejected"
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
      access_payment_status: ["trial", "active", "locked"],
      access_role: ["therapist", "patient"],
      app_role: ["admin", "user", "therapist"],
      payment_request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
