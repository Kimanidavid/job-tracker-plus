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
      interviews: {
        Row: {
          application_id: string
          completed: boolean
          created_at: string
          follow_up: string | null
          id: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_name: string | null
          notes: string | null
          reminder_sent: boolean
          scheduled_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          completed?: boolean
          created_at?: string
          follow_up?: string | null
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_name?: string | null
          notes?: string | null
          reminder_sent?: boolean
          scheduled_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          completed?: boolean
          created_at?: string
          follow_up?: string | null
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_name?: string | null
          notes?: string | null
          reminder_sent?: boolean
          scheduled_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          application_type: Database["public"]["Enums"]["application_type"]
          company_name: string
          company_website: string | null
          contact_info: string | null
          created_at: string
          date_applied: string
          id: string
          job_title: string
          notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          application_type?: Database["public"]["Enums"]["application_type"]
          company_name: string
          company_website?: string | null
          contact_info?: string | null
          created_at?: string
          date_applied?: string
          id?: string
          job_title: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          application_type?: Database["public"]["Enums"]["application_type"]
          company_name?: string
          company_website?: string | null
          contact_info?: string | null
          created_at?: string
          date_applied?: string
          id?: string
          job_title?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
      application_status:
        | "applied"
        | "under_review"
        | "interview_stage"
        | "offer_received"
        | "rejected"
        | "employed"
        | "offer_declined"
        | "withdrawn"
      application_type:
        | "job"
        | "bootcamp"
        | "internship"
        | "freelance"
        | "contract"
        | "other"
      interview_type:
        | "phone_screen"
        | "technical"
        | "behavioral"
        | "final"
        | "other"
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
      application_status: [
        "applied",
        "under_review",
        "interview_stage",
        "offer_received",
        "rejected",
        "employed",
        "offer_declined",
        "withdrawn",
      ],
      application_type: [
        "job",
        "bootcamp",
        "internship",
        "freelance",
        "contract",
        "other",
      ],
      interview_type: [
        "phone_screen",
        "technical",
        "behavioral",
        "final",
        "other",
      ],
    },
  },
} as const
