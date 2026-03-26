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
  if (user.role === "MEMBER") {
    return <Navigate to="/app/member" replace />;
  }
  if (user.role === "EXPERT") {
    return <Navigate to="/app/expert" replace />;
  }
  if (user.role === "INVESTOR") return <Navigate to="/app/investor" replace />;
  return <Navigate to="/app/investor" replace />;
}
