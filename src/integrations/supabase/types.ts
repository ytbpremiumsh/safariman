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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          achievements: string | null
          birth_date: string
          category: Database["public"]["Enums"]["program_category"] | null
          city: string
          created_at: string
          cv_url: string | null
          donation_invoice_id: string | null
          donation_paid_at: string | null
          donation_status: string
          donation_url: string | null
          edit_token: string
          education: string
          email: string
          essay_contribution: string | null
          essay_dream: string | null
          essay_worthy: string | null
          full_name: string
          gender: string
          id: string
          occupation: string
          organization_experience: string | null
          paid_at: string | null
          payment_invoice_id: string | null
          payment_status: string
          payment_url: string | null
          photo_url: string | null
          reason: string | null
          registration_code: string
          social_media: string | null
          status: Database["public"]["Enums"]["participant_status"]
          twibbon_confirmed_at: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          achievements?: string | null
          birth_date: string
          category?: Database["public"]["Enums"]["program_category"] | null
          city: string
          created_at?: string
          cv_url?: string | null
          donation_invoice_id?: string | null
          donation_paid_at?: string | null
          donation_status?: string
          donation_url?: string | null
          edit_token?: string
          education: string
          email: string
          essay_contribution?: string | null
          essay_dream?: string | null
          essay_worthy?: string | null
          full_name: string
          gender: string
          id?: string
          occupation: string
          organization_experience?: string | null
          paid_at?: string | null
          payment_invoice_id?: string | null
          payment_status?: string
          payment_url?: string | null
          photo_url?: string | null
          reason?: string | null
          registration_code?: string
          social_media?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          twibbon_confirmed_at?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          achievements?: string | null
          birth_date?: string
          category?: Database["public"]["Enums"]["program_category"] | null
          city?: string
          created_at?: string
          cv_url?: string | null
          donation_invoice_id?: string | null
          donation_paid_at?: string | null
          donation_status?: string
          donation_url?: string | null
          edit_token?: string
          education?: string
          email?: string
          essay_contribution?: string | null
          essay_dream?: string | null
          essay_worthy?: string | null
          full_name?: string
          gender?: string
          id?: string
          occupation?: string
          organization_experience?: string | null
          paid_at?: string | null
          payment_invoice_id?: string | null
          payment_status?: string
          payment_url?: string | null
          photo_url?: string | null
          reason?: string | null
          registration_code?: string
          social_media?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          twibbon_confirmed_at?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      twibbon_downloads: {
        Row: {
          created_at: string
          day: string
          id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin_if_first: { Args: never; Returns: boolean }
      gen_registration_code: { Args: never; Returns: string }
      get_countdown_enabled: { Args: never; Returns: boolean }
      get_countdown_target: { Args: never; Returns: string }
      get_gelombang_config: { Args: never; Returns: string }
      get_panduan_url: { Args: never; Returns: string }
      get_twibbon_download_stats: {
        Args: { p_days?: number }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_twibbon_frame_url: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_essay_complete_participants: {
        Args: never
        Returns: {
          achievements: string
          birth_date: string
          category: Database["public"]["Enums"]["program_category"]
          city: string
          created_at: string
          cv_url: string
          donation_paid_at: string
          donation_status: string
          education: string
          email: string
          essay_contribution: string
          essay_dream: string
          essay_worthy: string
          full_name: string
          gender: string
          id: string
          occupation: string
          organization_experience: string
          paid_at: string
          payment_status: string
          photo_url: string
          reason: string
          registration_code: string
          social_media: string
          status: Database["public"]["Enums"]["participant_status"]
          twibbon_confirmed_at: string
          updated_at: string
          whatsapp: string
        }[]
      }
      log_twibbon_download: { Args: never; Returns: undefined }
      lookup_hasil_seleksi_by_code: {
        Args: { p_code: string }
        Returns: {
          found: boolean
          full_name: string
          result: string
        }[]
      }
      lookup_participant_by_code: {
        Args: { p_code: string }
        Returns: {
          category: Database["public"]["Enums"]["program_category"]
          donation_status: string
          full_name: string
          has_berkas: boolean
          has_essay: boolean
          id: string
          payment_status: string
          status: Database["public"]["Enums"]["participant_status"]
        }[]
      }
      lookup_payment_status_by_code: {
        Args: { p_code: string }
        Returns: {
          category: Database["public"]["Enums"]["program_category"]
          donation_paid_at: string
          donation_status: string
          donation_url: string
          full_name: string
          id: string
          paid_at: string
          payment_status: string
          payment_url: string
          status: Database["public"]["Enums"]["participant_status"]
        }[]
      }
      mark_donation_paid: { Args: { p_invoice_id: string }; Returns: boolean }
      mark_payment_paid: { Args: { p_invoice_id: string }; Returns: boolean }
      register_participant:
        | {
            Args: {
              p_birth_date: string
              p_city: string
              p_education: string
              p_email: string
              p_full_name: string
              p_gender: string
              p_occupation: string
              p_whatsapp: string
            }
            Returns: {
              full_name: string
              id: string
              registration_code: string
            }[]
          }
        | {
            Args: {
              p_birth_date: string
              p_category?: Database["public"]["Enums"]["program_category"]
              p_city: string
              p_education: string
              p_email: string
              p_full_name: string
              p_gender: string
              p_occupation: string
              p_whatsapp: string
            }
            Returns: {
              full_name: string
              id: string
              registration_code: string
            }[]
          }
        | {
            Args: {
              p_birth_date: string
              p_category?: Database["public"]["Enums"]["program_category"]
              p_city: string
              p_education: string
              p_email: string
              p_full_name: string
              p_gender: string
              p_instagram?: string
              p_occupation: string
              p_whatsapp: string
            }
            Returns: {
              full_name: string
              id: string
              registration_code: string
            }[]
          }
      save_donation_invoice: {
        Args: { p_code: string; p_invoice_id: string; p_url: string }
        Returns: boolean
      }
      save_payment_invoice: {
        Args: { p_code: string; p_invoice_id: string; p_url: string }
        Returns: boolean
      }
      submit_berkas_by_code:
        | {
            Args: {
              p_category: Database["public"]["Enums"]["program_category"]
              p_code: string
              p_cv_url: string
              p_essay_contribution: string
              p_essay_dream: string
              p_essay_worthy: string
              p_photo_url: string
            }
            Returns: boolean
          }
        | {
            Args: { p_code: string; p_cv_url: string; p_photo_url: string }
            Returns: boolean
          }
        | {
            Args: {
              p_code: string
              p_cv_url: string
              p_essay_contribution: string
              p_essay_dream: string
              p_essay_worthy: string
              p_photo_url: string
            }
            Returns: boolean
          }
      submit_essay_by_code: {
        Args: {
          p_code: string
          p_essay_contribution: string
          p_essay_dream: string
          p_essay_worthy: string
        }
        Returns: boolean
      }
      update_participant_with_token: {
        Args: {
          p_category?: Database["public"]["Enums"]["program_category"]
          p_cv_url?: string
          p_id: string
          p_photo_url?: string
          p_token: string
          p_twibbon_confirmed?: boolean
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      participant_status:
        | "pending"
        | "reviewed"
        | "interview"
        | "accepted"
        | "rejected"
      program_category:
        | "fully_funded"
        | "partial_funded"
        | "self_funded"
        | "gelombang_1"
        | "gelombang_2"
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
      app_role: ["admin", "user"],
      participant_status: [
        "pending",
        "reviewed",
        "interview",
        "accepted",
        "rejected",
      ],
      program_category: [
        "fully_funded",
        "partial_funded",
        "self_funded",
        "gelombang_1",
        "gelombang_2",
      ],
    },
  },
} as const
