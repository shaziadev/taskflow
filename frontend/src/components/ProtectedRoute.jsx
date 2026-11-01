import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/** Redirects to /login when the user is not authenticated. */
export default function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
