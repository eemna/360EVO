import { createBrowserRouter } from "react-router";
import AppLayout from "../app/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
   {
  
  path: "/app",
  element: (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  ),
    children: [
      {
        index: true,
        element:
        <RoleRoute allowedRoles={["member", "expert","startup"]}>
         <Dashboard />
         </RoleRoute>
      },
    ],
  },
]);
