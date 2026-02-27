import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export default function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "ADMIN") {
    return <Navigate to="/app/admin" replace />;
  }

  if (user.role === "STARTUP") {
    return <Navigate to="/app/startup" replace />;
  }

  return <Navigate to="/" replace />;
}
