import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isDemoMode } = useAuth();
  const location = useLocation();

  // Check if this is an OAuth callback (Enable Banking returns with ?code=)
  const urlParams = new URLSearchParams(location.search);
  const hasOAuthCode = urlParams.has("code");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Allow temporary access if OAuth callback is in progress (session may still be restoring)
  if (!user && !isDemoMode && !hasOAuthCode) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
