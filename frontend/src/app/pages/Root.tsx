import { Outlet } from "react-router";
import TopNav from "../components/layout/TopNav";
import LeftSidebar from "../components/layout/LeftSidebar";

export default function Root() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-6 pt-20 px-4">
          <LeftSidebar />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
