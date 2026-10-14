import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";
export default function RequireAdmin() {
  const auth = useAuth(),
    location = useLocation();
  if (auth.loading) return <Spinner />;
  if (!auth.user)
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  if (!auth.admin)
    return (
      <div className="max-w-xl mx-auto p-6">
        <EmptyState title="You're not authorized">
          <p>This account is not listed as a Two Tech administrator.</p>
          {auth.error && <p role="alert">{auth.error}</p>}
          <button className="btn bs mt-4" onClick={() => api.logout()}>
            Sign out
          </button>
        </EmptyState>
      </div>
    );
  return <Outlet />;
}
