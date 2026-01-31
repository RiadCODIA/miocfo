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
      alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      application_logs: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          request_id: string | null
          service: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          level: string
          message: string
          metadata?: Json | null
          request_id?: string | null
          service: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          request_id?: string | null
          service?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          result: string | null
          target_id: string | null
          target_name: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          result?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          result?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
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
          plaid_access_token: string | null
          plaid_account_id: string
          plaid_item_id: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string | null
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
          plaid_access_token?: string | null
          plaid_account_id: string
          plaid_item_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
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
          plaid_access_token?: string | null
          plaid_account_id?: string
          plaid_item_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          ai_category_id: string | null
          ai_confidence: number | null
          amount: number
          balance_after: number | null
          bank_account_id: string
          bank_tx_code: string | null
          bank_tx_description: string | null
          category: string[] | null
          category_confirmed: boolean | null
          created_at: string
          credit_debit_indicator: string | null
          creditor_iban: string | null
          creditor_name: string | null
          currency: string | null
          date: string
          debtor_iban: string | null
          debtor_name: string | null
          entry_reference: string | null
          id: string
          mcc_code: string | null
          merchant_name: string | null
          name: string
          payment_channel: string | null
          pending: boolean | null
          plaid_transaction_id: string
          raw_data: Json | null
          reference_number: string | null
          transaction_date: string | null
          transaction_type: string | null
          value_date: string | null
        }
        Insert: {
          ai_category_id?: string | null
          ai_confidence?: number | null
          amount: number
          balance_after?: number | null
          bank_account_id: string
          bank_tx_code?: string | null
          bank_tx_description?: string | null
          category?: string[] | null
          category_confirmed?: boolean | null
          created_at?: string
          credit_debit_indicator?: string | null
          creditor_iban?: string | null
          creditor_name?: string | null
          currency?: string | null
          date: string
          debtor_iban?: string | null
          debtor_name?: string | null
          entry_reference?: string | null
          id?: string
          mcc_code?: string | null
          merchant_name?: string | null
          name: string
          payment_channel?: string | null
          pending?: boolean | null
          plaid_transaction_id: string
          raw_data?: Json | null
          reference_number?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          value_date?: string | null
        }
        Update: {
          ai_category_id?: string | null
          ai_confidence?: number | null
          amount?: number
          balance_after?: number | null
          bank_account_id?: string
          bank_tx_code?: string | null
          bank_tx_description?: string | null
          category?: string[] | null
          category_confirmed?: boolean | null
          created_at?: string
          credit_debit_indicator?: string | null
          creditor_iban?: string | null
          creditor_name?: string | null
          currency?: string | null
          date?: string
          debtor_iban?: string | null
          debtor_name?: string | null
          entry_reference?: string | null
          id?: string
          mcc_code?: string | null
          merchant_name?: string | null
          name?: string
          payment_channel?: string | null
          pending?: boolean | null
          plaid_transaction_id?: string
          raw_data?: Json | null
          reference_number?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_ai_category_id_fkey"
            columns: ["ai_category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          actual_expenses: number | null
          actual_income: number | null
          created_at: string | null
          id: string
          month: string
          notes: string | null
          predicted_expenses: number | null
          predicted_income: number | null
          updated_at: string | null
        }
        Insert: {
          actual_expenses?: number | null
          actual_income?: number | null
          created_at?: string | null
          id?: string
          month: string
          notes?: string | null
          predicted_expenses?: number | null
          predicted_income?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_expenses?: number | null
          actual_income?: number | null
          created_at?: string | null
          id?: string
          month?: string
          notes?: string | null
          predicted_expenses?: number | null
          predicted_income?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categorization_rules: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          match_type: string | null
          pattern: string
          priority: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          match_type?: string | null
          pattern: string
          priority?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          match_type?: string | null
          pattern?: string
          priority?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          alerts_count: number | null
          cashflow: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          owner_id: string | null
          phone: string | null
          revenue: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vat_number: string | null
        }
        Insert: {
          alerts_count?: number | null
          cashflow?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          owner_id?: string | null
          phone?: string | null
          revenue?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Update: {
          alerts_count?: number | null
          cashflow?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          revenue?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      company_financials: {
        Row: {
          cashflow: number | null
          company_id: string | null
          created_at: string | null
          current_ratio: number | null
          debt_ratio: number | null
          dso: number | null
          expenses: number | null
          id: string
          income: number | null
          margin: number | null
          month: string
          revenue: number | null
        }
        Insert: {
          cashflow?: number | null
          company_id?: string | null
          created_at?: string | null
          current_ratio?: number | null
          debt_ratio?: number | null
          dso?: number | null
          expenses?: number | null
          id?: string
          income?: number | null
          margin?: number | null
          month: string
          revenue?: number | null
        }
        Update: {
          cashflow?: number | null
          company_id?: string | null
          created_at?: string | null
          current_ratio?: number | null
          debt_ratio?: number | null
          dso?: number | null
          expenses?: number | null
          id?: string
          income?: number | null
          margin?: number | null
          month?: string
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_financials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      deadlines: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          due_date: string
          id: string
          invoice_id: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          invoice_id?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_id?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      feature_flags: {
        Row: {
          created_at: string | null
          description: string
          enabled: boolean | null
          id: string
          key: string
          rollout_percentage: number | null
          target_companies: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          enabled?: boolean | null
          id?: string
          key: string
          rollout_percentage?: number | null
          target_companies?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          enabled?: boolean | null
          id?: string
          key?: string
          rollout_percentage?: number | null
          target_companies?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          company_id: string | null
          company_name: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string
          id: string
          request_type: string
          status: string | null
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          request_type: string
          status?: string | null
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          request_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          config: Json | null
          created_at: string | null
          error_rate: number | null
          id: string
          last_sync_at: string | null
          name: string
          provider_type: string
          rate_limit_hits: number | null
          status: string | null
          updated_at: string | null
          uptime: number | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          last_sync_at?: string | null
          name: string
          provider_type: string
          rate_limit_hits?: number | null
          status?: string | null
          updated_at?: string | null
          uptime?: number | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          error_rate?: number | null
          id?: string
          last_sync_at?: string | null
          name?: string
          provider_type?: string
          rate_limit_hits?: number | null
          status?: string | null
          updated_at?: string | null
          uptime?: number | null
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
      ip_allowlist: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          critical_alerts: boolean | null
          email_notifications: boolean | null
          id: string
          notification_email: string | null
          notify_budget: boolean | null
          notify_cashflow: boolean | null
          notify_deadlines: boolean | null
          notify_liquidity: boolean | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
          weekly_reports: boolean | null
        }
        Insert: {
          created_at?: string | null
          critical_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          notification_email?: string | null
          notify_budget?: boolean | null
          notify_cashflow?: boolean | null
          notify_deadlines?: boolean | null
          notify_liquidity?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_reports?: boolean | null
        }
        Update: {
          created_at?: string | null
          critical_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          notification_email?: string | null
          notify_budget?: boolean | null
          notify_cashflow?: boolean | null
          notify_deadlines?: boolean | null
          notify_liquidity?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_reports?: boolean | null
        }
        Relationships: []
      }
      product_financials: {
        Row: {
          created_at: string | null
          fixed_costs_share: number | null
          id: string
          period_end: string
          period_start: string
          product_id: string | null
          revenue: number | null
          variable_costs: number | null
        }
        Insert: {
          created_at?: string | null
          fixed_costs_share?: number | null
          id?: string
          period_end: string
          period_start: string
          product_id?: string | null
          revenue?: number | null
          variable_costs?: number | null
        }
        Update: {
          created_at?: string | null
          fixed_costs_share?: number | null
          id?: string
          period_end?: string
          period_start?: string
          product_id?: string | null
          revenue?: number | null
          variable_costs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_financials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
        ]
      }
      products_services: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      security_policies: {
        Row: {
          id: string
          policy_type: string
          settings: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          policy_type: string
          settings?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          policy_type?: string
          settings?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_features_enabled: boolean | null
          billing_cycle: string | null
          created_at: string | null
          features: string[] | null
          id: string
          max_bank_accounts: number | null
          max_transactions_month: number | null
          max_users: number | null
          name: string
          price: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_features_enabled?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          features?: string[] | null
          id?: string
          max_bank_accounts?: number | null
          max_transactions_month?: number | null
          max_users?: number | null
          name: string
          price?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_features_enabled?: boolean | null
          billing_cycle?: string | null
          created_at?: string | null
          features?: string[] | null
          id?: string
          max_bank_accounts?: number | null
          max_transactions_month?: number | null
          max_users?: number | null
          name?: string
          price?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          provider_id: string | null
          records_processed: number | null
          stack_trace: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          provider_id?: string | null
          records_processed?: number | null
          stack_trace?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          provider_id?: string | null
          records_processed?: number | null
          stack_trace?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          environment: string | null
          id: string
          measured_at: string | null
          metadata: Json | null
          metric_type: string
          value: number
        }
        Insert: {
          environment?: string | null
          id?: string
          measured_at?: string | null
          metadata?: Json | null
          metric_type: string
          value: number
        }
        Update: {
          environment?: string | null
          id?: string
          measured_at?: string | null
          metadata?: Json | null
          metric_type?: string
          value?: number
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
