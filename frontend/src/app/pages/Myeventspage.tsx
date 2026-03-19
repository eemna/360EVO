import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Globe,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../../context/ToastContext";

interface EventItem {
  id: string;
  title: string;
  type: "CONFERENCE" | "NETWORKING" | "PITCH_DAY" | "WORKSHOP";
  date: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  capacity?: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  coverImage?: string;
  organizer: { id: string; name: string };
  _count: { registrations: number };
}

const TYPE_COLORS: Record<string, string> = {
  CONFERENCE: "bg-blue-100 text-blue-700",
  NETWORKING: "bg-purple-100 text-purple-700",
  PITCH_DAY: "bg-orange-100 text-orange-700",
  WORKSHOP: "bg-green-100 text-green-700",
};

const TYPE_LABELS: Record<string, string> = {
  CONFERENCE: "Conference",
  NETWORKING: "Networking",
  PITCH_DAY: "Pitch Day",
  WORKSHOP: "Workshop",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-700",
  PUBLISHED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(date: string) {
  const d = new Date(date.endsWith("Z") ? date : date + "Z");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function isPast(date: string) {
  return new Date(date) < new Date();
}

function EventRow({
  event,
  showStatus,
  onPublish,
  onDelete,
}: {
  event: EventItem;
  showStatus?: boolean;
  onPublish?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const past = isPast(event.date);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 hover:shadow-sm transition-shadow ${
        past ? "opacity-70" : ""
      }`}
    >
      {/* Cover thumbnail */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex-shrink-0">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-blue-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[event.type]}`}
            >
              {TYPE_LABELS[event.type]}
            </span>
            {showStatus && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status]}`}
              >
                {event.status}
              </span>
            )}
            {past && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Past
              </span>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mt-1 truncate">
          {event.title}
        </h3>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(event.date)}</span>
            <span>·</span>
            <span>{formatTime(event.date)}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{event.location}</span>
            </div>
          )}

          {!event.location && event.virtualLink && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Globe className="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            <span>
              {event._count.registrations}
              {event.capacity ? ` / ${event.capacity}` : ""} registered
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          onClick={() => navigate(`/app/events/${event.id}`)}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Button>

        {showStatus && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={() => navigate(`/app/events/${event.id}/edit`)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>

            {event.status === "DRAFT" && onPublish && (
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onPublish(event.id)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Publish
              </Button>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => onDelete(event.id)}
              >
                <XCircle className="w-3.5 h-3.5" />
                Delete
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-5 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-2xl">
      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type Tab = "organized" | "registered";

export default function MyEventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const canOrganize = user?.role === "ADMIN" || user?.role === "EXPERT";

  const [tab, setTab] = useState<Tab>(canOrganize ? "organized" : "registered");
  const [organized, setOrganized] = useState<EventItem[]>([]);
  const [registered, setRegistered] = useState<EventItem[]>([]);
  const [loadingOrganized, setLoadingOrganized] = useState(false);
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  useEffect(() => {
    if (!canOrganize) return;
    const fetch = async () => {
      try {
        setLoadingOrganized(true);
        const { data } = await api.get("/events/user/mine");
        setOrganized(data);
      } catch {
        showToast({
          type: "error",
          title: "Failed to load your events",
          message: "",
        });
      } finally {
        setLoadingOrganized(false);
      }
    };
    fetch();
  }, [canOrganize, showToast]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingRegistered(true);
        const { data } = await api.get("/events/user/registered");
        setRegistered(data.events ?? data);
      } catch {
        showToast({
          type: "error",
          title: "Failed to load registrations",
          message: "",
        });
      } finally {
        setLoadingRegistered(false);
      }
    };
    fetch();
  }, [showToast]);

  const handlePublish = async (id: string) => {
    try {
      await api.post(`/events/${id}/publish`);
      setOrganized((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "PUBLISHED" } : e)),
      );
      showToast({ type: "success", title: "Event published!", message: "" });
    } catch {
      showToast({ type: "error", title: "Publish failed", message: "" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await api.delete(`/events/${id}`);
      setOrganized((prev) => prev.filter((e) => e.id !== id));
      showToast({ type: "success", title: "Event deleted", message: "" });
    } catch {
      showToast({ type: "error", title: "Delete failed", message: "" });
    }
  };

  const upcomingRegistered = registered.filter((e) => !isPast(e.date));
  const pastRegistered = registered.filter((e) => isPast(e.date));

  const upcomingOrganized = organized.filter((e) => !isPast(e.date));
  const pastOrganized = organized.filter((e) => isPast(e.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">My Events</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your events and registrations.
          </p>
        </div>
        {canOrganize && (
          <Button
            onClick={() => navigate("/app/events/create")}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {canOrganize && (
          <button
            onClick={() => setTab("organized")}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === "organized"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            My Organized Events
            {organized.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {organized.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setTab("registered")}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "registered"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Registered Events
          {registered.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {registered.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: Organized  */}
      {tab === "organized" && canOrganize && (
        <div className="space-y-8">
          {loadingOrganized ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : organized.length === 0 ? (
            <EmptyState
              message="You haven't organized any events yet."
              action={
                <Button
                  onClick={() => navigate("/app/events/create")}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create your first event
                </Button>
              }
            />
          ) : (
            <>
              {/* Upcoming */}
              {upcomingOrganized.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Upcoming ({upcomingOrganized.length})
                  </h2>
                  {upcomingOrganized.map((e) => (
                    <EventRow
                      key={e.id}
                      event={e}
                      showStatus
                      onPublish={handlePublish}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {/* Past */}
              {pastOrganized.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Past ({pastOrganized.length})
                  </h2>
                  {pastOrganized.map((e) => (
                    <EventRow key={e.id} event={e} showStatus />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Registered  */}
      {tab === "registered" && (
        <div className="space-y-8">
          {loadingRegistered ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : registered.length === 0 ? (
            <EmptyState
              message="You haven't registered for any events yet."
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate("/app/events")}
                >
                  Browse Events
                </Button>
              }
            />
          ) : (
            <>
              {/* Upcoming */}
              {upcomingRegistered.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Upcoming ({upcomingRegistered.length})
                  </h2>
                  {upcomingRegistered.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              )}

              {/* Past */}
              {pastRegistered.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Past ({pastRegistered.length})
                  </h2>
                  {pastRegistered.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
