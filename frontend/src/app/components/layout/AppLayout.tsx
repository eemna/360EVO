import { Outlet } from "react-router";
import { useState } from "react";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
export default function AppLayout() {
  const [SidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex pt-16 ">
        
         <LeftSidebar
          isOpen={SidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />


        
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}