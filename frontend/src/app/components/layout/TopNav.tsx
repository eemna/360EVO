import { Link } from "react-router";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "../../../hooks/useAuth";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Search, Bell, MessageSquare, Home, Users, Briefcase } from "lucide-react";

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <nav className="fixed top-0 z-50 w-full bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link to="/app" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <span className="text-sm font-bold text-white">360</span>
            </div>
            <span className="hidden font-bold text-gray-900 sm:inline">360EVO</span>
          </Link>

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-10"
            />
          </div>

          {/* Navigation Icons */}
          <div className="ml-auto flex items-center gap-2">
            <Link to="/app">
              <Button variant="ghost" size="icon" className="relative">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/app/network">
              <Button variant="ghost" size="icon" className="relative">
                <Users className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/app/projects">
              <Button variant="ghost" size="icon" className="relative">
                <Briefcase className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/app/messages">
              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </Link>
            <Link to="/app/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                   <div className="flex flex-col">
                   <span className="font-semibold">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <Link to="/app/profile/me">
                  <DropdownMenuItem>My Profile</DropdownMenuItem>
                </Link>
                <Link to="/app/settings">
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <Link to="/">
                  <DropdownMenuItem onClick={handleLogout}>
                      Sign out
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
