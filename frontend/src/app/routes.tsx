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
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import { MemberDashboard } from "./pages/MemberDashboard";
import { MessagesPage } from "./pages/MessagesPage";
import { ExpertDashboard } from "./pages/ExpertDashboard";
import { BookConsultationPage } from "./pages/BookConsultationPage";
import { ManageReservations } from "./pages/ManageReservations";
import ExpertsPage from "./pages/ExpertsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/Eventdetailpage";
import CreateEventForm from "./pages/Createeventform";
import MyEventsPage from "./pages/Myeventspage";
import SavedProjectsPage from "./pages/Bookmarkfeature";

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
      { path: "experts", element: <ExpertsPage /> },
      {
        path: "startup",
        element: (
          <RoleRoute allowedRoles={["STARTUP"]}>
            <StartupDashboard />
          </RoleRoute>
        ),
      },
      {
        path: "member",
        element: (
          <RoleRoute allowedRoles={["MEMBER"]}>
            <MemberDashboard />
          </RoleRoute>
        ),
      },
      {
        path: "expert",
        element: (
          <RoleRoute allowedRoles={["EXPERT"]}>
            <ExpertDashboard />
          </RoleRoute>
        ),
      },
      {
        path: "expert/reservations",
        element: (
          <RoleRoute allowedRoles={["EXPERT"]}>
            <ManageReservations />
          </RoleRoute>
        ),
      },
      {
        path: "experts/:expertId/book",
        element: (
          <RoleRoute allowedRoles={["MEMBER", "STARTUP", "ADMIN"]}>
            <BookConsultationPage />
          </RoleRoute>
        ),
      },
      {
        path: "projects",
        element: <ProjectGallery />,
      },
      { path: "saved", element: <SavedProjectsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "conversation", element: <MessagesPage /> },
      {
        path: "profile/:id",
        element: <Profile />,
      },
      { path: "events",           element: <EventsPage /> },
{ path: "events/create",    element: <CreateEventForm /> },
{ path: "events/my",        element: <MyEventsPage /> },        
{ path: "events/:id",       element: <EventDetailPage /> },     
{ path: "events/:id/edit",  element: <CreateEventForm /> },  
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "startup/projects/:id",
        element: (
          <RoleRoute allowedRoles={["STARTUP", "ADMIN", "EXPERT", "MEMBER"]}>
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
