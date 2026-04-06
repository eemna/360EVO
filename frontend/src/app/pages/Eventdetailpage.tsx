import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Globe,
  User,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Share2,
} from "lucide-react";
import { Button } from "../components/ui/button";
//import { Badge } from "../components/ui/badge";
import { useToast } from "../../context/ToastContext";

interface Registration {
  id: string;
  user: { id: string; name: string };
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  type: "CONFERENCE" | "NETWORKING" | "PITCH_DAY" | "WORKSHOP";
  date: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  capacity?: number;
  coverImage?: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  hostType: "ADMIN" | "EXPERT";
  organizer: { id: string; name: string };
  registrations: Registration[];
  _count: { registrations: number };
  isRegistered: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  CONFERENCE: "bg-blue-100 text-blue-700 border-blue-200",
  NETWORKING: "bg-purple-100 text-purple-700 border-purple-200",
  PITCH_DAY: "bg-orange-100 text-orange-700 border-orange-200",
  WORKSHOP: "bg-green-100 text-green-700 border-green-200",
};

const TYPE_LABELS: Record<string, string> = {
  CONFERENCE: "Conference",
  NETWORKING: "Networking",
  PITCH_DAY: "Pitch Day",
  WORKSHOP: "Workshop",
};

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(date: string) {
  const d = new Date(date);
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOrganizer = event?.organizer.id === user?.id;
  const isAdmin = user?.role === "ADMIN";
  const canManage = isOrganizer || isAdmin;
  const isFull =
    event?.capacity != null && event._count.registrations >= event.capacity;

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/events/${id}`);
        setEvent(data);
      } catch {
        showToast({ type: "error", title: "Event not found", message: "" });
        navigate("/app/events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate, showToast]);

  const handleRegister = async () => {
    if (!event) return;
    try {
      setRegistering(true);
      if (event.isRegistered) {
        await api.delete(`/events/${event.id}/register`);
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                isRegistered: false,
                _count: { registrations: prev._count.registrations - 1 },
              }
            : prev,
        );
        showToast({
          type: "success",
          title: "Registration cancelled",
          message: "",
        });
      } else {
        await api.post(`/events/${event.id}/register`);
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                isRegistered: true,
                _count: { registrations: prev._count.registrations + 1 },
              }
            : prev,
        );
        showToast({
          type: "success",
          title: "Registered successfully!",
          message: `You're registered for "${event.title}"`,
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Something went wrong";

      showToast({
        type: "error",
        title: "Action failed",
        message: errorMessage,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !window.confirm("Delete this event? This cannot be undone."))
      return;
    try {
      setDeleting(true);
      await api.delete(`/events/${event.id}`);
      showToast({ type: "success", title: "Event deleted", message: "" });
      navigate("/app/events");
    } catch {
      showToast({ type: "error", title: "Delete failed", message: "" });
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async () => {
    if (!event) return;
    try {
      await api.post(`/events/${event.id}/publish`);
      setEvent((prev) => (prev ? { ...prev, status: "PUBLISHED" } : prev));
      showToast({
        type: "success",
        title: "Event published!",
        message: "It is now visible to everyone.",
      });
    } catch {
      showToast({ type: "error", title: "Publish failed", message: "" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-100 rounded" />
        <div className="h-72 bg-gray-100 rounded-2xl" />
        <div className="h-6 w-2/3 bg-gray-100 rounded" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!event) return null;

  const spotsLeft =
    event.capacity != null ? event.capacity - event._count.registrations : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/app/events")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </button>

      {/* Cover Image */}
      <div className="relative h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-blue-300" />
          </div>
        )}

        {/* Status badge for organizer */}
        {canManage && event.status !== "PUBLISHED" && (
          <div className="absolute top-4 left-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                event.status === "DRAFT"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : "bg-red-100 text-red-700 border-red-200"
              }`}
            >
              {event.status}
            </span>
          </div>
        )}

        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${TYPE_COLORS[event.type]}`}
          >
            {TYPE_LABELS[event.type]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {event.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>
                Organized by{" "}
                <span className="font-medium text-gray-700">
                  {event.organizer.name}
                </span>
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">
              About this event
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Attendees preview — only for organizer */}
          {canManage && event.registrations.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">
                Attendees ({event._count.registrations})
              </h2>
              <div className="space-y-2">
                {event.registrations.slice(0, 10).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold">
                      {r.user.name.substring(0, 1)}
                    </div>
                    <span className="text-sm text-gray-700">{r.user.name}</span>
                  </div>
                ))}
                {event.registrations.length > 10 && (
                  <p className="text-sm text-gray-400 pt-1">
                    +{event.registrations.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — details card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 sticky top-4">
            {/* Date & Time */}
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(event.date)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatTime(event.date)}
                  {event.endDate &&
                    formatTime(event.endDate) !== formatTime(event.date) &&
                    ` – ${formatTime(event.endDate)}`}
                </p>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{event.location}</p>
              </div>
            )}

            {/* Virtual Link */}
            {event.virtualLink && (
              <div className="flex gap-3">
                <Globe className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <a
                  href={event.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  Join Online
                </a>
              </div>
            )}

            {/* Capacity */}
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">
                    {event._count.registrations}
                  </span>
                  {event.capacity != null && (
                    <span className="text-gray-500">
                      {" "}
                      / {event.capacity} spots
                    </span>
                  )}{" "}
                  registered
                </p>
                {spotsLeft != null && spotsLeft <= 5 && spotsLeft > 0 && (
                  <p className="text-xs text-orange-600 font-medium mt-0.5">
                    Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left!
                  </p>
                )}
                {isFull && (
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    Event is fully booked
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-3">
              {/* Register / Cancel button — not shown to organizer */}
              {!canManage && event.status === "PUBLISHED" && (
                <Button
                  onClick={handleRegister}
                  disabled={registering || (isFull && !event.isRegistered)}
                  className={`w-full gap-2 ${
                    event.isRegistered
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  variant={event.isRegistered ? "outline" : "primary"}
                >
                  {event.isRegistered ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      {registering ? "Cancelling..." : "Cancel Registration"}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {registering
                        ? "Registering..."
                        : isFull
                          ? "Fully Booked"
                          : "Register Now"}
                    </>
                  )}
                </Button>
              )}

              {/* Organizer actions */}
              {canManage && (
                <div className="space-y-2">
                  {event.status === "DRAFT" && (
                    <Button
                      onClick={handlePublish}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Publish Event
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => navigate(`/app/events/${event.id}/edit`)}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Event
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? "Deleting..." : "Delete Event"}
                  </Button>
                </div>
              )}

              {/* Share */}
              <Button
                variant="ghost"
                className="w-full gap-2 text-gray-500"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast({
                    type: "success",
                    title: "Link copied!",
                    message: "",
                  });
                }}
              >
                <Share2 className="w-4 h-4" />
                Share Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
