export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      room_participants: {
        Row: {
          display_name: string
          id: string
          joined_at: string
          last_seen: string
          room_id: string
          user_id: string
        }
        Insert: {
          display_name: string
          id?: string
          joined_at?: string
          last_seen?: string
          room_id: string
          user_id: string
        }
        Update: {
          display_name?: string
          id?: string
          joined_at?: string
          last_seen?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
            onDelete: "CASCADE"
          }
        ]
      }

      rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          room_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }

      pages: {
        Row: {
          id: string
          title: string | null
          content: Json | null
          created_at: string
          created_by: string | null
          room_id: string
        }
        Insert: {
          id?: string
          title?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          room_id: string
        }
        Update: {
          id?: string
          title?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
            onDelete: "CASCADE"
          }
        ]
      }

      page_history: {
        Row: {
          id: string
          page_id: string
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          content?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_history_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
            onDelete: "CASCADE"
          }
        ]
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

// === Helper Types ===

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][TableName] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][TableName] extends {
  Update: infer U
}
  ? U
  : never

export type Enums<
  EnumName extends keyof DefaultSchema["Enums"]
> = DefaultSchema["Enums"][EnumName]

export type CompositeTypes<
  CompositeTypeName extends keyof DefaultSchema["CompositeTypes"]
> = DefaultSchema["CompositeTypes"][CompositeTypeName]

export const Constants = {
  public: {
    Enums: {},
  },
} as const
