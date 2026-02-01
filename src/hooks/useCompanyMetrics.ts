import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyMetrics {
  users: number;
  bankAccounts: number;
  transactions30d: number;
  syncFailed7d: number;
}

export function useCompanyMetrics(companyId: string) {
  return useQuery({
    queryKey: ["company-metrics", companyId],
    queryFn: async (): Promise<CompanyMetrics> => {
      // Get company to find the user_id
      const { data: company } = await supabase
        .from("companies")
        .select("user_id")
        .eq("id", companyId)
        .maybeSingle();

      if (!company?.user_id) {
        return {
          users: 0,
          bankAccounts: 0,
          transactions30d: 0,
          syncFailed7d: 0,
        };
      }

      // Count bank accounts for the company's user
      const { count: bankAccountsCount } = await supabase
        .from("bank_accounts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", company.user_id);

      // Get bank account IDs for transaction count
      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("user_id", company.user_id);

      let transactions30d = 0;
      if (bankAccounts && bankAccounts.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const bankAccountIds = bankAccounts.map(ba => ba.id);
        
        const { count: txCount } = await supabase
          .from("bank_transactions")
          .select("*", { count: "exact", head: true })
          .in("bank_account_id", bankAccountIds)
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);
        
        transactions30d = txCount || 0;
      }

      // Count failed syncs in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: syncFailed } = await supabase
        .from("sync_jobs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "failed")
        .gte("created_at", sevenDaysAgo.toISOString());

      return {
        users: 1, // Currently 1 user per company
        bankAccounts: bankAccountsCount || 0,
        transactions30d,
        syncFailed7d: syncFailed || 0,
      };
    },
    enabled: !!companyId,
  });
}

// Hook to get aggregated platform metrics for super admin dashboard
export function usePlatformMetrics() {
  return useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      // Count total companies
      const { count: companiesCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      // Count active companies
      const { count: activeCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Count total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Count total bank accounts
      const { count: bankAccountsCount } = await supabase
        .from("bank_accounts")
        .select("*", { count: "exact", head: true });

      // Count transactions last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: transactionsCount } = await supabase
        .from("bank_transactions")
        .select("*", { count: "exact", head: true })
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      // Count running sync jobs (active sessions proxy)
      const { count: activeSessions } = await supabase
        .from("sync_jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "running");

      return {
        totalCompanies: companiesCount || 0,
        activeCompanies: activeCompanies || 0,
        totalUsers: usersCount || 0,
        totalBankAccounts: bankAccountsCount || 0,
        transactions30d: transactionsCount || 0,
        activeSessions: activeSessions || 0,
      };
    },
  });
}
