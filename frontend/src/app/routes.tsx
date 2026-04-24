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
import InvestorSetupWizard from "./pages/Investorsetupwizard";
import MatchFeedPage from "./pages/Matchfeedpage";
import InvestorDashboard from "./pages/InvestorDashboard";
import DdInboxPage from "./pages/Ddinboxpage";
import DataRoomPage from "./pages/Dataroompage";
import DealBriefPage from "./pages/Dealbriefpage";
import ConsultationPaymentPage from "./pages/ConsultationPaymentPage";
import ProgramsPage from "./pages/Programspage";
import ProgramDetailPage from "./pages/Programdetailpage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import EventPaymentPage from "./pages/EventPaymentPage";
import CreateProgramPage from "./pages/CreateProgramPage";
import ProgramPaymentPage from "./pages/ProgramPaymentPage";
import SearchResultsPage from "./pages/Searchresultspage";

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
        path: "investor",
        element: (
          <RoleRoute allowedRoles={["INVESTOR"]}>
            <InvestorDashboard />
          </RoleRoute>
        ),
      },

      {
        path: "investor/setup",
        element: (
          <RoleRoute allowedRoles={["INVESTOR"]}>
            <InvestorSetupWizard />
          </RoleRoute>
        ),
      },
      {
        path: "investor/matches",
        element: (
          <RoleRoute allowedRoles={["INVESTOR"]}>
            <MatchFeedPage />
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
          <RoleRoute allowedRoles={["MEMBER", "STARTUP", "ADMIN", "INVESTOR"]}>
            <BookConsultationPage />
          </RoleRoute>
        ),
      },
      {
        path: "consultations/:bookingId/pay",
        element: (
          <RoleRoute allowedRoles={["MEMBER", "STARTUP", "ADMIN", "INVESTOR"]}>
            <ConsultationPaymentPage />
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
      { path: "events", element: <EventsPage /> },
      { path: "events/create", element: <CreateEventForm /> },
      { path: "events/my", element: <MyEventsPage /> },
      { path: "events/:id", element: <EventDetailPage /> },
      { path: "events/:id/edit", element: <CreateEventForm /> },
      {
        path: "programs/create",
        element: (
          <RoleRoute allowedRoles={["ADMIN"]}>
            <CreateProgramPage />
          </RoleRoute>
        ),
      },
      {
        path: "programs/:id/edit",
        element: (
          <RoleRoute allowedRoles={["ADMIN"]}>
            <CreateProgramPage />
          </RoleRoute>
        ),
      },
      { path: "programs", element: <ProgramsPage /> },
      {
        path: "programs/my-applications",
        element: (
          <ProtectedRoute>
            <MyApplicationsPage />
          </ProtectedRoute>
        ),
      },
      { path: "programs/:id", element: <ProgramDetailPage /> },
      { path: "programs/:id/pay", element: <ProgramPaymentPage /> },
      {
        path: "events/:id/pay",
        element: (
          <ProtectedRoute>
            <EventPaymentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "startup/projects/:id",
        element: (
          <RoleRoute
            allowedRoles={["STARTUP", "ADMIN", "EXPERT", "MEMBER", "INVESTOR"]}
          >
            <ProjectDetailsPage />
          </RoleRoute>
        ),
      },
      {
        path: "startup/dd-requests",
        element: (
          <RoleRoute allowedRoles={["STARTUP"]}>
            <DdInboxPage />
          </RoleRoute>
        ),
      },
      {
        path: "investor/dd-requests",
        element: (
          <RoleRoute allowedRoles={["INVESTOR"]}>
            <DdInboxPage />
          </RoleRoute>
        ),
      },
      {
        path: "startup/data-rooms/:id",
        element: (
          <RoleRoute allowedRoles={["STARTUP"]}>
            <DataRoomPage />
          </RoleRoute>
        ),
      },
      {
        path: "investor/data-rooms/:id",
        element: (
          <RoleRoute allowedRoles={["INVESTOR"]}>
            <DataRoomPage />
          </RoleRoute>
        ),
      },
      {
        path: "investor/data-rooms/:id/deal-brief",
        element: (
          <RoleRoute allowedRoles={["INVESTOR"]}>
            <DealBriefPage />
          </RoleRoute>
        ),
      },
      {
        path: "search",
        element: <SearchResultsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
