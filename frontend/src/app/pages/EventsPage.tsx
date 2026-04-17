import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import { Search, Plus, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface Organizer {
  id: string;
  name: string;
}

interface Event {
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
  organizer: Organizer;
  _count: { registrations: number };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const EVENT_TYPES = [
  { label: "All Types", value: "" },
  { label: "Conference", value: "CONFERENCE" },
  { label: "Networking", value: "NETWORKING" },
  { label: "Pitch Day", value: "PITCH_DAY" },
  { label: "Workshop", value: "WORKSHOP" },
];

const DATE_OPTIONS = [
  { label: "All Dates", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

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

function formatTime(date: string) {
  const d = new Date(date);
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateRange(date: string, endDate?: string) {
  const start = new Date(date);
  const dateStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const startTime = formatTime(date);

  if (!endDate) return { date: dateStr, time: startTime };

  const endTime = formatTime(endDate);

  const timeStr =
    startTime === endTime ? startTime : `${startTime} – ${endTime}`;

  return { date: dateStr, time: timeStr };
}

function getDateFilter(value: string): string | undefined {
  const now = new Date();

  if (value === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  if (value === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  if (value === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return start.toISOString();
  }
  return undefined;
}
function isEventPast(event: Event): boolean {
  const now = new Date();
  
  const endTime = event.endDate ? new Date(event.endDate) : new Date(event.date);
  return endTime < now;
}

function isEventFull(event: Event): boolean {
  if (!event.capacity) return false;
  return event._count.registrations >= event.capacity;
}
function EventCard({ event }: { event: Event }) {
  const navigate = useNavigate();
  const { date, time } = formatDateRange(event.date, event.endDate);

  const past = isEventPast(event);
  const full = isEventFull(event);
  const unavailable = past || full;

  return (
    <div
      onClick={() => navigate(`/app/events/${event.id}`)}
      className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer overflow-hidden group relative
        ${unavailable
          ? "border-gray-100 opacity-70 hover:opacity-80"
          : "border-gray-100 hover:shadow-md"
        }`}
    >
      {/* Cover Image */}
      <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className={`w-full h-full object-cover transition-transform duration-300
              ${unavailable ? "grayscale-[40%]" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <Calendar className="w-12 h-12 text-blue-300" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${TYPE_COLORS[event.type]}`}>
            {TYPE_LABELS[event.type]}
          </span>
        </div>

        {/* Status Overlay Badge */}
        {past && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-900/60 text-white text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm">
              Event Ended
            </span>
          </div>
        )}
        {!past && full && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-red-700/70 text-white text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm">
              Fully Booked
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className={`font-semibold text-lg leading-snug mb-3 line-clamp-2 transition-colors
          ${unavailable ? "text-gray-400" : "text-gray-900 group-hover:text-blue-600"}`}>
          {event.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4 flex-shrink-0 text-blue-500" />
            <span>{date}</span>
            <span className="text-gray-400">·</span>
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4 flex-shrink-0 text-blue-500" />
            <span className="truncate">
              {event.location || (event.virtualLink ? "Online" : "TBD")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <span className="text-gray-400">Organized by </span>
            <span className="font-medium text-gray-700">{event.organizer.name}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{event._count.registrations}</span>
            {event.capacity && (
              <span className="text-gray-400">/ {event.capacity}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-px bg-gray-100 mt-4" />
        <div className="flex justify-between pt-1">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);

  const canCreateEvent = user?.role === "ADMIN" || user?.role === "EXPERT";

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, string> = {
        page: String(page),
        limit: "9",
      };

      if (search.trim()) params.search = search.trim();
      if (selectedType) params.type = selectedType;

      const dateValue = getDateFilter(selectedDate);
      if (dateValue) params.date = dateValue;

      const { data } = await api.get("/events", { params });
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedDate, page]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedType, selectedDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Events</h1>
        </div>

        {canCreateEvent && (
          <Button
            onClick={() => navigate("/app/events/create")}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search events by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-12 rounded-xl border-gray-200 bg-white text-base shadow-sm"
        />
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-500 mr-2">
            Event Type
          </span>
          {EVENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedType === type.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Date</span>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-36 rounded-xl border-gray-200 bg-white shadow-sm">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              {DATE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value === "" ? "all" : opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      {!loading && pagination && (
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">{events.length}</span> of{" "}
          <span className="font-medium text-gray-700">{pagination.total}</span>{" "}
          event{pagination.total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No events found
          </h3>
          <p className="text-gray-500 text-sm">
            {search || selectedType || selectedDate
              ? "Try adjusting your filters."
              : "No events have been published yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  page === i + 1
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
