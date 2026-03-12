import { Link } from "react-router";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "../../../hooks/useAuth";
import { useNavigate } from "react-router";
import { Menu } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import api from "../../../services/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useSocket } from "../../../hooks/useSocket";
import {
  Bell,
  MessageSquare,
  Home,
  Users,
  Briefcase,
  GraduationCap,
} from "lucide-react";

interface TopNavProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth();
  //const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const { onlineUsers, socket } = useSocket();
  const isOnline = onlineUsers.has(user?.id ?? "");

  // Messages
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch unread messages
  useEffect(() => {
    let cancelled = false;
    api
      .get("/conversations")
      .then(({ data }) => {
        if (!cancelled) {
          const total = data.reduce(
            (sum: number, conv: { unread: number }) => sum + conv.unread,
            0,
          );
          setUnreadMessages(total);
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch notifications on mount
  useEffect(() => {
    let cancelled = false;
    api
      .get("/notifications")
      .then(({ data }) => {
        if (!cancelled) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  // Socket: new message
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message: { senderId: string }) => {
      if (message.senderId !== user?.id) {
        setUnreadMessages((prev) => prev + 1);
      }
    };
    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, user]);

  // Socket: new notification
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await api.put("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClickNotification = async (n: Notification) => {
    if (!n.isRead) {
      await api.put(`/notifications/${n.id}/read`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, isRead: true } : item,
        ),
      );
    }
    if (n.link) navigate(n.link);
    setNotifOpen(false);
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Hamburger */}
          <Button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="size-6 text-gray-600" />
          </Button>

          {/* Logo */}
          <Link to="/app" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <span className="text-sm font-bold text-white">360</span>
            </div>
            <span className="hidden font-bold text-gray-900 sm:inline">
              360EVO
            </span>
          </Link>

          {/* Right side icons */}
          <div className="ml-auto flex items-center gap-2">
            <Link to="/app">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/app/network">
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/app/projects">
              <Button variant="ghost" size="icon">
                <Briefcase className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/app/experts">
              <Button variant="ghost" size="icon">
                <GraduationCap className="h-5 w-5" />
              </Button>
            </Link>
            {/* Messages */}
            <Link to="/app/conversation">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setUnreadMessages(0)}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white px-1">
                    {unreadMessages}
                  </span>
                )}
              </Button>
            </Link>

            {/* ── Notification Bell ── */}
            <div
              className="relative"
              ref={notifRef}
              onMouseEnter={() => setNotifOpen(true)}
              onMouseLeave={() => setNotifOpen(false)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotifOpen((prev) => !prev)}
              >
                <Bell className="h-5 w-5 cursor-pointer" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-200">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">
                        No notifications
                      </p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleClickNotification(n)}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
                            !n.isRead ? "bg-indigo-50" : ""
                          }`}
                        >
                          <p
                            className={`text-sm font-medium ${!n.isRead ? "text-indigo-800" : "text-gray-800"}`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {n.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-b border-gray-200 text-center">
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        navigate("/app/notifications");
                      }}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* ── End Notification Bell ── */}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={user?.profile?.avatar ?? undefined} />
                      <AvatarFallback>
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
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
