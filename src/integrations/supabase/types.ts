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
      ambulance_service: {
        Row: {
          created_at: string | null
          description: string | null
          equipment: string[] | null
          id: string
          is_active: boolean | null
          phone_landline: string
          phone_mobile: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          phone_landline: string
          phone_mobile: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          phone_landline?: string
          phone_mobile?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string | null
          doctor_type: string
          id: string
          medical_officer_id: string | null
          notes: string | null
          patient_id: string
          reason: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
          visiting_doctor_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string | null
          doctor_type: string
          id?: string
          medical_officer_id?: string | null
          notes?: string | null
          patient_id: string
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
          visiting_doctor_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string | null
          doctor_type?: string
          id?: string
          medical_officer_id?: string | null
          notes?: string | null
          patient_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
          visiting_doctor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_medical_officer_id_fkey"
            columns: ["medical_officer_id"]
            isOneToOne: false
            referencedRelation: "medical_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visiting_doctor_id_fkey"
            columns: ["visiting_doctor_id"]
            isOneToOne: false
            referencedRelation: "visiting_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      management_team: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          position: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          position: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          position?: string
        }
        Relationships: []
      }
      medical_officers: {
        Row: {
          created_at: string | null
          designation: string
          email: string | null
          id: string
          is_senior: boolean | null
          name: string
          phone_mobile: string[] | null
          phone_office: string | null
          photo_url: string | null
          qualification: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          designation: string
          email?: string | null
          id?: string
          is_senior?: boolean | null
          name: string
          phone_mobile?: string[] | null
          phone_office?: string | null
          photo_url?: string | null
          qualification: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          designation?: string
          email?: string | null
          id?: string
          is_senior?: boolean | null
          name?: string
          phone_mobile?: string[] | null
          phone_office?: string | null
          photo_url?: string | null
          qualification?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      visiting_doctors: {
        Row: {
          created_at: string | null
          id: string
          is_monthly: boolean | null
          month_week: number | null
          name: string
          photo_url: string | null
          specialization: string
          updated_at: string | null
          visit_day: string
          visit_time_end: string
          visit_time_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_monthly?: boolean | null
          month_week?: number | null
          name: string
          photo_url?: string | null
          specialization: string
          updated_at?: string | null
          visit_day: string
          visit_time_end: string
          visit_time_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_monthly?: boolean | null
          month_week?: number | null
          name?: string
          photo_url?: string | null
          specialization?: string
          updated_at?: string | null
          visit_day?: string
          visit_time_end?: string
          visit_time_start?: string
        }
        Relationships: []
      }
      working_staff: {
        Row: {
          created_at: string | null
          designation: string
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
        }
        Insert: {
          created_at?: string | null
          designation: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
        }
        Update: {
          created_at?: string | null
          designation?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
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
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
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
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
    },
  },
} as const
