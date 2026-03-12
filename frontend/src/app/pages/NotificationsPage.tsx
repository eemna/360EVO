import { useEffect, useState } from "react";
import api from "../../services/axios";
import { Bell, BookOpen, MessageSquare, Calendar, Info } from "lucide-react";
import { cn } from "../components/ui/utils";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { Skeleton } from "../components/ui/skeleton";

interface Notification {
  id: string;
  type: "MESSAGE" | "BOOKING" | "EVENT" | "PROJECT_UPDATE" | "SYSTEM";
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const iconMap = {
  MESSAGE: <MessageSquare className="h-5 w-5 text-blue-500" />,
  BOOKING: <Calendar className="h-5 w-5 text-indigo-500" />,
  EVENT: <Bell className="h-5 w-5 text-yellow-500" />,
  PROJECT_UPDATE: <BookOpen className="h-5 w-5 text-green-500" />,
  SYSTEM: <Info className="h-5 w-5 text-gray-500" />,
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/notifications").then(({ data }) => {
      setNotifications(data.notifications ?? data);
      setLoading(false);
    });
  }, []);

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await api.put(`/notifications/${notif.id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
    }
    if (notif.link) navigate(notif.link);
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };
  const clearAll = async () => {
    await api.delete("/notifications/clear-all");
    setNotifications([]);
  };
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                Mark all as read
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4  border border-gray-200 rounded-xl"
              >
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={cn(
                "w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm",
                notif.isRead
                  ? "bg-white border-gray-100 text-gray-500"
                  : "bg-indigo-50 border-indigo-100 text-gray-900",
              )}
            >
              <div className="mt-0.5 flex-shrink-0">{iconMap[notif.type]}</div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm",
                    !notif.isRead && "text-gray-900",
                  )}
                >
                  {notif.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{notif.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.isRead && (
                <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
