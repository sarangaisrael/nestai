export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: string | null;
          cover_image: string | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content?: string | null;
          cover_image?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          content?: string | null;
          cover_image?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      feature_toggles: {
        Row: { id: string; key: string; label: string; enabled: boolean; category: string; config: Json; created_at: string; updated_at: string; };
        Insert: { id?: string; key: string; label: string; enabled?: boolean; category?: string; config?: Json; created_at?: string; updated_at?: string; };
        Update: { id?: string; key?: string; label?: string; enabled?: boolean; category?: string; config?: Json; updated_at?: string; };
      };
      landing_blocks: {
        Row: { id: string; block_key: string; content: Json; sort_order: number; visible: boolean; created_at: string; updated_at: string; };
        Insert: { id?: string; block_key: string; content: Json; sort_order?: number; visible?: boolean; created_at?: string; updated_at?: string; };
        Update: { id?: string; block_key?: string; content?: Json; sort_order?: number; visible?: boolean; updated_at?: string; };
      };
      landing_content: {
        Row: { id: number; [key: string]: any; };
        Insert: { id?: number; [key: string]: any; };
        Update: { id?: number; [key: string]: any; };
      };
      meditations: {
        Row: { id: string; title: string; description: string; media_url: string; media_type: string; tags: string[]; published: boolean; sort_order: number; created_at: string; updated_at: string; };
        Insert: { id?: string; title: string; description?: string; media_url: string; media_type?: string; tags?: string[]; published?: boolean; sort_order?: number; created_at?: string; updated_at?: string; };
        Update: { id?: string; title?: string; description?: string; media_url?: string; media_type?: string; tags?: string[]; published?: boolean; sort_order?: number; updated_at?: string; };
      };
      messages: {
        Row: { id: string; user_id: string; role: string; content: string; created_at: string; };
        Insert: { id?: string; user_id: string; role: string; content: string; created_at?: string; };
        Update: { id?: string; user_id?: string; role?: string; content?: string; };
      };
      monthly_summaries: {
        Row: { id: string; user_id: string; summary: string; month: string; created_at: string; };
        Insert: { id?: string; user_id: string; summary: string; month: string; created_at?: string; };
        Update: { id?: string; user_id?: string; summary?: string; month?: string; };
      };
      mood_entries: {
        Row: { id: string; user_id: string; mood: string; created_at: string; };
        Insert: { id?: string; user_id: string; mood: string; created_at?: string; };
        Update: { id?: string; user_id?: string; mood?: string; };
      };
      professional_leads: {
        Row: { id: string; email: string; phone: string | null; created_at: string; };
        Insert: { id?: string; email: string; phone?: string | null; created_at?: string; };
        Update: { id?: string; email?: string; phone?: string | null; };
      };
      profiles: {
        Row: { id: string; user_id: string; first_name: string | null; last_name: string | null; email: string | null; created_at: string; updated_at: string; [key: string]: any; };
        Insert: { id?: string; user_id: string; first_name?: string | null; last_name?: string | null; email?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; user_id?: string; first_name?: string | null; last_name?: string | null; email?: string | null; updated_at?: string; };
      };
      push_subscriptions: {
        Row: { id: string; user_id: string; endpoint: string; created_at: string; [key: string]: any; };
        Insert: { id?: string; user_id: string; endpoint: string; created_at?: string; [key: string]: any; };
        Update: { id?: string; user_id?: string; endpoint?: string; };
      };
      pwa_installations: {
        Row: { id: string; user_id: string | null; platform: string; created_at: string; };
        Insert: { id?: string; user_id?: string | null; platform?: string; created_at?: string; };
        Update: { id?: string; user_id?: string | null; platform?: string; };
      };
      system_messages: {
        Row: { id: string; title: string; body: string; created_at: string; };
        Insert: { id?: string; title: string; body: string; created_at?: string; };
        Update: { id?: string; title?: string; body?: string; };
      };
      user_feedback: {
        Row: { id: string; user_id: string | null; message: string; created_at: string; [key: string]: any; };
        Insert: { id?: string; user_id?: string | null; message: string; created_at?: string; [key: string]: any; };
        Update: { id?: string; user_id?: string | null; message?: string; };
      };
      user_preferences: {
        Row: { id: string; user_id: string; [key: string]: any; };
        Insert: { id?: string; user_id: string; [key: string]: any; };
        Update: { id?: string; user_id?: string; [key: string]: any; };
      };
      weekly_summaries: {
        Row: { id: string; user_id: string; summary: string; week_start: string; created_at: string; [key: string]: any; };
        Insert: { id?: string; user_id: string; summary: string; week_start: string; created_at?: string; [key: string]: any; };
        Update: { id?: string; user_id?: string; summary?: string; week_start?: string; };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
