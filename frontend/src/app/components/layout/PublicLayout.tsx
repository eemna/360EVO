import { Outlet } from "react-router";
import { Navigation } from "./PublicNavbar";
import { Footer } from "./PublicFooter";
import { useAnalytics } from "../../../hooks/useAnalytics";
export default function PublicLayout() {
  useAnalytics();
  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B2A]">
      <Navigation />
      <main className="flex-1 flex items-center justify-center pt-[65px]">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
