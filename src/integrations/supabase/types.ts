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
      admin_clients: {
        Row: {
          admin_id: string
          client_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          admin_id: string
          client_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          admin_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string | null
          account_subtype: string | null
          account_type: string | null
          available_balance: number | null
          bank_name: string
          created_at: string
          currency: string | null
          current_balance: number | null
          iban: string | null
          id: string
          last_sync_at: string | null
          mask: string | null
          plaid_access_token: string
          plaid_account_id: string
          plaid_item_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_subtype?: string | null
          account_type?: string | null
          available_balance?: number | null
          bank_name: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          last_sync_at?: string | null
          mask?: string | null
          plaid_access_token: string
          plaid_account_id: string
          plaid_item_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_subtype?: string | null
          account_type?: string | null
          available_balance?: number | null
          bank_name?: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          iban?: string | null
          id?: string
          last_sync_at?: string | null
          mask?: string | null
          plaid_access_token?: string
          plaid_account_id?: string
          plaid_item_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          category: string[] | null
          created_at: string
          currency: string | null
          date: string
          id: string
          merchant_name: string | null
          name: string
          payment_channel: string | null
          pending: boolean | null
          plaid_transaction_id: string
          transaction_type: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          category?: string[] | null
          created_at?: string
          currency?: string | null
          date: string
          id?: string
          merchant_name?: string | null
          name: string
          payment_channel?: string | null
          pending?: boolean | null
          plaid_transaction_id: string
          transaction_type?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          category?: string[] | null
          created_at?: string
          currency?: string | null
          date?: string
          id?: string
          merchant_name?: string | null
          name?: string
          payment_channel?: string | null
          pending?: boolean | null
          plaid_transaction_id?: string
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          cashflow_type: Database["public"]["Enums"]["cashflow_type"] | null
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          cashflow_type?: Database["public"]["Enums"]["cashflow_type"] | null
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          cashflow_type?: Database["public"]["Enums"]["cashflow_type"] | null
          cost_type?: Database["public"]["Enums"]["cost_type"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          annual_cost: number
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          monthly_cost: number | null
          name: string
          notes: string | null
          role: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          annual_cost: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          monthly_cost?: number | null
          name: string
          notes?: string | null
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_cost?: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          monthly_cost?: number | null
          name?: string
          notes?: string | null
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          invoice_date: string
          invoice_number: string
          match_status: string | null
          matched_transaction_id: string | null
          raw_data: Json | null
          supplier_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          match_status?: string | null
          matched_transaction_id?: string | null
          raw_data?: Json | null
          supplier_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          match_status?: string | null
          matched_transaction_id?: string | null
          raw_data?: Json | null
          supplier_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_matched_transaction_id_fkey"
            columns: ["matched_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      revenue_centers: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vat_rates: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          rate: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          rate: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          rate?: number
          updated_at?: string | null
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
      app_role: "user" | "admin_aziendale" | "super_admin"
      cashflow_type: "operational" | "investment" | "financing"
      cost_type: "fixed" | "variable"
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
      app_role: ["user", "admin_aziendale", "super_admin"],
      cashflow_type: ["operational", "investment", "financing"],
      cost_type: ["fixed", "variable"],
    },
  },
} as const
