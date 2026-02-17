import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
