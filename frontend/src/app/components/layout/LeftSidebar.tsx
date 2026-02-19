import { Link, useLocation } from "react-router";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "../../../hooks/useAuth";
import {
  Home,
  User,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Settings,
  X,
} from "lucide-react";
import { cn } from "../ui/utils";

interface ResponsiveSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/app" },
  { icon: User, label: "My Profile", path: "/app/profile/me" },
  { icon: Users, label: "My Network", path: "/app/network" },
  { icon: Briefcase, label: "Projects", path: "/app/projects" },
  { icon: MessageSquare, label: "Messages", path: "/app/messages" },
  { icon: Bell, label: "Notifications", path: "/app/notifications" },
  { icon: Settings, label: "Settings", path: "/app/settings" },
];

export default function LeftSidebar({
  isOpen,
  onClose,
}: ResponsiveSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Overlay (mobile only) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
  className={cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
    isOpen ? "translate-x-0" : "-translate-x-full",
    "lg:static lg:translate-x-0"
  )}
>

        <div className="relative h-full overflow-y-auto p-4 bg-gray-50">

          {/* Close Button (mobile only) */}
          <Button
            onClick={onClose}
            className="absolute right-4 top-4 lg:hidden p-2 rounded-md hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5 text-gray-600" />
          </Button>

          {/* Profile Card */}
          <Card className="overflow-hidden border-none shadow mb-4">
            <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="relative px-4 pb-4">
              <Avatar className="absolute -top-8 h-16 w-16 border-4 border-white">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="pt-10">
                <Link
                  to="/app/profile/me"
                  className="font-semibold hover:text-blue-600"
                >
                  {user?.name}
                </Link>
                <p className="text-sm text-gray-500">{user?.role}</p>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-2 border-none shadow">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </Card>
        </div>
      </aside>
    </>
  );
}


