import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useUserSubscription";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isDemoMode } = useAuth();
  const location = useLocation();
  const { canAccessRoute, isLoading: subLoading, isSuperAdmin, hasSubscription } = useUserSubscription();

  // Check if this is an OAuth callback (Enable Banking returns with ?code=)
  const urlParams = new URLSearchParams(location.search);
  const hasOAuthCode = urlParams.has("code");

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            {hasOAuthCode ? "Collegamento banca in corso..." : "Caricamento..."}
          </p>
        </div>
      </div>
    );
  }

  // Allow temporary access if OAuth callback is in progress (session may still be restoring)
  if (!user && !isDemoMode && !hasOAuthCode) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Super admins bypass all checks
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // If user has no subscription, redirect to upgrade (except for settings pages)
  const alwaysAllowed = ["/dashboard", "/impostazioni", "/configurazione", "/comunicazioni"];
  if (!hasSubscription && !alwaysAllowed.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check route access based on subscription features
  if (hasSubscription && !canAccessRoute(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
