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
      bills: {
        Row: {
          amount_pence: number | null
          auto_reminders_enabled: boolean
          created_at: string
          created_by: string
          currency: string
          description: string | null
          end_date: string | null
          frequency: string
          household_id: string
          id: string
          next_due_date: string
          provider: string
          reminder_offsets_days: number[]
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount_pence?: number | null
          auto_reminders_enabled?: boolean
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency: string
          household_id: string
          id?: string
          next_due_date: string
          provider: string
          reminder_offsets_days?: number[]
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount_pence?: number | null
          auto_reminders_enabled?: boolean
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          household_id?: string
          id?: string
          next_due_date?: string
          provider?: string
          reminder_offsets_days?: number[]
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          household_id: string
          id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          household_id: string
          id?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          household_id?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      in_app_notifications: {
        Row: {
          body: string | null
          created_at: string
          household_id: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          household_id: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          household_id?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "in_app_notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          channel: string
          created_at: string
          due_date: string
          household_id: string
          id: string
          recipient_user_id: string | null
          remind_on: string
          sent_at: string | null
          source_id: string
          source_type: string
          status: string
          title: string
        }
        Insert: {
          channel?: string
          created_at?: string
          due_date: string
          household_id: string
          id?: string
          recipient_user_id?: string | null
          remind_on: string
          sent_at?: string | null
          source_id: string
          source_type: string
          status?: string
          title: string
        }
        Update: {
          channel?: string
          created_at?: string
          due_date?: string
          household_id?: string
          id?: string
          recipient_user_id?: string | null
          remind_on?: string
          sent_at?: string | null
          source_id?: string
          source_type?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_checked: boolean
          name: string
          quantity: string | null
          shopping_list_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_checked?: boolean
          name: string
          quantity?: string | null
          shopping_list_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_checked?: boolean
          name?: string
          quantity?: string | null
          shopping_list_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          created_by: string
          household_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_household_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to_user_id: string | null
          created_at: string
          created_by: string
          due_date: string | null
          household_id: string
          id: string
          notes: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          household_id: string
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          household_id?: string
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          created_by: string
          household_id: string
          id: string
          insurance_renewal_date: string | null
          mot_expiry_date: string | null
          nickname: string | null
          notes: string | null
          registration: string
          service_due_date: string | null
          tax_expiry_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          insurance_renewal_date?: string | null
          mot_expiry_date?: string | null
          nickname?: string | null
          notes?: string | null
          registration: string
          service_due_date?: string | null
          tax_expiry_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          insurance_renewal_date?: string | null
          mot_expiry_date?: string | null
          nickname?: string | null
          notes?: string | null
          registration?: string
          service_due_date?: string | null
          tax_expiry_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_household_member: { Args: { hh_id: string }; Returns: boolean }
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
