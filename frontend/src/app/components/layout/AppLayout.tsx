
import { Outlet } from "react-router";
import TopNav from "./TopNav";

export default function AppLayout() {
  return (
    <div>
      <TopNav />
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}
