import { createBrowserRouter } from "react-router";
import AppLayout from "../app/components/layout/AppLayout";
import PublicLayout from "../app/components/layout/PublicLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StartupDashboard from "./pages/StartupDashboard";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AdminDashboard from "./pages/AdminDashboard";
import RoleRedirect from "./RoleRedirect";
import ProjectDetailsPage from "./pages/ProjectDetails";
import { ProjectGallery } from "./pages/ProjectGallery";
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
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
      element: <RoleRedirect />,
    },

    {
      path: "admin",
      element: (
        <RoleRoute allowedRoles={["ADMIN"]}>
          <AdminDashboard />
        </RoleRoute>
      ),
    },
    {
      path: "startup",
      element: (
        <RoleRoute allowedRoles={["STARTUP"]}>
          <StartupDashboard />
        </RoleRoute>
      ),
      
    },
     {
      path: "projects",  
      element: <ProjectGallery />,
    },
    {
  path: "startup/projects/:id",
  element: (
    <RoleRoute allowedRoles={["STARTUP", "ADMIN"]}>
      <ProjectDetailsPage />
    </RoleRoute>
  ),
},
  ],
},
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
