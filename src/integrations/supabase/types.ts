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
      health_visits: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          prescription: string | null
          reason_category: Database["public"]["Enums"]["visit_reason"]
          reason_notes: string | null
          reason_subcategory: string | null
          student_id: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          prescription?: string | null
          reason_category: Database["public"]["Enums"]["visit_reason"]
          reason_notes?: string | null
          reason_subcategory?: string | null
          student_id: string
          updated_at?: string
          visit_date?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          prescription?: string | null
          reason_category?: Database["public"]["Enums"]["visit_reason"]
          reason_notes?: string | null
          reason_subcategory?: string | null
          student_id?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "medical_officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      mentors: {
        Row: {
          created_at: string
          department: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          batch: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          mentor_id: string | null
          phone: string | null
          program: string
          roll_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          batch: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          mentor_id?: string | null
          phone?: string | null
          program: string
          roll_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          batch?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mentor_id?: string | null
          phone?: string | null
          program?: string
          roll_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "doctor" | "mentor" | "student" | "admin"
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      visit_reason:
        | "medical_illness"
        | "injury"
        | "mental_wellness"
        | "vaccination"
        | "routine_checkup"
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
      app_role: ["doctor", "mentor", "student", "admin"],
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      visit_reason: [
        "medical_illness",
        "injury",
        "mental_wellness",
        "vaccination",
        "routine_checkup",
        "other",
      ],
    },
  },
} as const
