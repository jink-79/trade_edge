import { Navigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { getStoredToken, useCurrentUser } from "../hooks/use-auth";

/**
 * Gates the authenticated app shell.
 *
 * - No token at all → straight to /login (no request made).
 * - Token present → validate it against GET /auth/me. While validating
 *   (and we have no cached user yet) show a spinner. If the token is
 *   rejected, the axios 401 interceptor clears storage and redirects.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const hasToken = Boolean(getStoredToken());
  const { data: user, isLoading, isError } = useCurrentUser();

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (isError && !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
