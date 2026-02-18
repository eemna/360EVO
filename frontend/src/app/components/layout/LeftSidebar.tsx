import { Link, useLocation } from "react-router";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Home,
  User,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "../ui/utils";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/app" },
  { icon: User, label: "My Profile", path: "/app/profile/me" },
  { icon: Users, label: "My Network", path: "/app/network" },
  { icon: Briefcase, label: "Projects", path: "/app/projects" },
  { icon: MessageSquare, label: "Messages", path: "/app/messages" },
  { icon: Bell, label: "Notifications", path: "/app/notifications" },
  { icon: Settings, label: "Settings", path: "/app/settings" },
];

export default function LeftSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-20 space-y-4">
        {/* Profile Card */}
        <Card className="overflow-hidden">
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
                John Doe
              </Link>
              <p className="text-sm text-gray-500">Startup Founder</p>
              <div className="mt-3 flex justify-between border-t pt-3 text-xs">
                <div>
                  <div className="font-semibold text-gray-700">420</div>
                  <div className="text-gray-500">Connections</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">85</div>
                  <div className="text-gray-500">Following</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <Card className="p-2">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100",
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
  );
}
