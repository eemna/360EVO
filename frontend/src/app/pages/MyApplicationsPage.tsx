import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import {
  Rocket,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronRight,
  FileSearch,
  Users,
} from "lucide-react";

interface ProgramApplication {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  submittedAt: string;
  responses: { motivation?: string; experience?: string; goals?: string };
  program: {
    id: string;
    title: string;
    type: "INCUBATION" | "ACCELERATION" | "MENTORSHIP";
    startDate: string;
    endDate: string;
    status: string;
    organizer: { name: string };
  };
}

interface EventApplication {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  event: {
    id: string;
    title: string;
    type: string;
    date: string;
    endDate?: string;
    organizer: { name: string };
  };
}

interface IncomingEventApplication {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  user: { name: string; email: string; role: string };
  event: { id: string; title: string };
}

interface EventAppGroup {
  eventId: string;
  eventTitle: string;
  apps: IncomingEventApplication[];
}

const TYPE_CONFIG = {
  INCUBATION: {
    label: "Incubation",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700",
  },
  ACCELERATION: {
    label: "Acceleration",
    icon: Rocket,
    color: "bg-orange-100 text-orange-700",
  },
  MENTORSHIP: {
    label: "Mentorship",
    icon: TrendingUp,
    color: "bg-green-100 text-green-700",
  },
};

const STATUS_CONFIG = {
  PENDING: {
    label: "Under Review",
    icon: Clock,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  ACCEPTED: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  REJECTED: {
    label: "Not Selected",
    icon: XCircle,
    color: "bg-red-100 text-red-700 border-red-200",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    icon: XCircle,
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProgramApplicationCard({ app }: { app: ProgramApplication }) {
  const navigate = useNavigate();
  const TypeIcon = TYPE_CONFIG[app.program.type].icon;
  const statusCfg = STATUS_CONFIG[app.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="border border-gray-200 hover:shadow-sm transition-shadow">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className={`p-2.5 rounded-xl flex-shrink-0 ${TYPE_CONFIG[app.program.type].color}`}
          >
            <TypeIcon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {app.program.title}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}
              >
                <StatusIcon className="size-3" />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_CONFIG[app.program.type].color}`}
              >
                {TYPE_CONFIG[app.program.type].label}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Starts {formatDate(app.program.startDate)}
              </span>
              <span>by {app.program.organizer.name}</span>
            </div>
            {app.responses?.motivation && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic">
                "{app.responses.motivation}"
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Applied {formatDate(app.submittedAt)}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 gap-1"
            onClick={() => navigate(`/app/programs/${app.program.id}`)}
          >
            View Program <ChevronRight className="size-3" />
          </Button>
        </div>
        {app.status === "ACCEPTED" && (
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Congratulations! You've been accepted. Check your notifications
              for next steps.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventApplicationCard({ app }: { app: EventApplication }) {
  const navigate = useNavigate();
  const statusCfg = STATUS_CONFIG[app.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="border border-gray-200 hover:shadow-sm transition-shadow">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="p-2.5 rounded-xl flex-shrink-0 bg-purple-100 text-purple-700">
            <Calendar className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {app.event.title}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}
              >
                <StatusIcon className="size-3" />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                {app.event.type.replace("_", " ")}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(app.event.date)}
              </span>
              <span>by {app.event.organizer.name}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Applied {formatDate(app.createdAt)}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 gap-1"
            onClick={() => navigate(`/app/events/${app.event.id}`)}
          >
            View Event <ChevronRight className="size-3" />
          </Button>
        </div>
        {app.status === "ACCEPTED" && (
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Accepted! Check your notifications — you may need to complete
              payment to confirm your spot.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IncomingApplicationsPanel() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<EventAppGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events/user/mine")
      .then(async ({ data: events }) => {
        const results = await Promise.allSettled(
          events.map((e: { id: string; title: string }) =>
            api.get(`/events/${e.id}/applications`).then(({ data }) => ({
              eventId: e.id,
              eventTitle: e.title,
              apps: data,
            })),
          ),
        );
        const resolved = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<EventAppGroup>).value)
          .filter((g) => g.apps.length > 0);
        setGroups(resolved);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (
    eventId: string,
    appId: string,
    status: "ACCEPTED" | "REJECTED",
  ) => {
    try {
      await api.put(`/events/${eventId}/applications/${appId}/status`, {
        status,
      });
      setGroups((prev) =>
        prev.map((g) =>
          g.eventId === eventId
            ? {
                ...g,
                apps: g.apps.map((a) =>
                  a.id === appId ? { ...a, status } : a,
                ),
              }
            : g,
        ),
      );
      showToast({
        type: "success",
        title: `Application ${status.toLowerCase()}`,
        message: "",
      });
    } catch {
      showToast({ type: "error", title: "Failed to update", message: "" });
    }
  };
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Users className="size-10 text-gray-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            No applications yet
          </h3>
          <p className="text-sm text-gray-400">
            Applications to your events will appear here.
          </p>
          <Button
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/app/events/create")}
          >
            Create a Workshop
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Card key={group.eventId} className="border border-gray-200">
          <CardContent className="pt-5 pb-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {group.eventTitle}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {group.apps.length} application
                  {group.apps.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/app/events/${group.eventId}`)}
              >
                View Event
              </Button>
            </div>

            <div className="space-y-2">
              {group.apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {app.user.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {app.user.email} · {formatDate(app.createdAt)}
                    </p>
                  </div>

                  {app.status === "PENDING" ? (
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() =>
                          updateStatus(group.eventId, app.id, "ACCEPTED")
                        }
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          updateStatus(group.eventId, app.id, "REJECTED")
                        }
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`ml-3 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                        app.status === "ACCEPTED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type Tab = "programs" | "events" | "incoming";

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isExpert = user?.role === "EXPERT";

  const [activeTab, setActiveTab] = useState<Tab>("programs");
  const [programApps, setProgramApps] = useState<ProgramApplication[]>([]);
  const [eventApps, setEventApps] = useState<EventApplication[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [programFilter, setProgramFilter] = useState<
    "ALL" | "PENDING" | "ACCEPTED" | "REJECTED"
  >("ALL");
  const [eventFilter, setEventFilter] = useState<
    "ALL" | "PENDING" | "ACCEPTED" | "REJECTED"
  >("ALL");

  useEffect(() => {
    api
      .get("/programs/my-applications")
      .then(({ data }) => {
        const now = new Date();
        const active = data.filter((app: ProgramApplication) => {
          return new Date(app.program.endDate) >= now;
        });
        setProgramApps(active);
      })
      .catch(() =>
        showToast({
          type: "error",
          title: "Failed to load program applications",
          message: "",
        }),
      )
      .finally(() => setLoadingPrograms(false));

    api
      .get("/events/user/applications")
      .then(({ data }) => {
        const now = new Date();
        const active = data.filter((app: EventApplication) => {
          const eventEnd = app.event.endDate
            ? new Date(app.event.endDate)
            : new Date(app.event.date);
          return eventEnd >= now;
        });
        setEventApps(active);
      })
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
  }, [showToast]);

  const filteredPrograms =
    programFilter === "ALL"
      ? programApps
      : programApps.filter((a) => a.status === programFilter);
  const filteredEvents =
    eventFilter === "ALL"
      ? eventApps
      : eventApps.filter((a) => a.status === eventFilter);

  const programCounts = {
    ALL: programApps.length,
    PENDING: programApps.filter((a) => a.status === "PENDING").length,
    ACCEPTED: programApps.filter((a) => a.status === "ACCEPTED").length,
    REJECTED: programApps.filter((a) => a.status === "REJECTED").length,
  };

  const eventCounts = {
    ALL: eventApps.length,
    PENDING: eventApps.filter((a) => a.status === "PENDING").length,
    ACCEPTED: eventApps.filter((a) => a.status === "ACCEPTED").length,
    REJECTED: eventApps.filter((a) => a.status === "REJECTED").length,
  };

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    {
      key: "programs",
      label: "Program Applications",
      badge: programCounts.ALL,
    },
    { key: "events", label: "Event Applications", badge: eventCounts.ALL },
    ...(isExpert
      ? [{ key: "incoming" as Tab, label: "Manage My Event Applicants" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          My Applications
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your applications and
          {isExpert ? " manage your event applicants" : " their status"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 flex-wrap">
        {TABS.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === key
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === key
                    ? "bg-white/20"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Program Applications ── */}
      {activeTab === "programs" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setProgramFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  programFilter === f
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {f === "ALL" ? "All" : (STATUS_CONFIG[f]?.label ?? f)}{" "}
                <span className="ml-1 opacity-70">({programCounts[f]})</span>
              </button>
            ))}
          </div>

          {loadingPrograms ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileSearch className="size-10 text-gray-200 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  {programFilter === "ALL"
                    ? "No applications yet"
                    : `No ${programFilter.toLowerCase()} applications`}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Browse available programs and apply to get started.
                </p>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => window.location.assign("/app/programs")}
                >
                  Browse Programs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPrograms.map((app) => (
                <ProgramApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Event Applications ── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setEventFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  eventFilter === f
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {f === "ALL" ? "All" : (STATUS_CONFIG[f]?.label ?? f)}{" "}
                <span className="ml-1 opacity-70">({eventCounts[f]})</span>
              </button>
            ))}
          </div>

          {loadingEvents ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileSearch className="size-10 text-gray-200 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  {eventFilter === "ALL"
                    ? "No event applications yet"
                    : `No ${eventFilter.toLowerCase()} event applications`}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Browse events and apply to attend.
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.assign("/app/events")}
                >
                  Browse Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((app) => (
                <EventApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "incoming" && isExpert && <IncomingApplicationsPanel />}
    </div>
  );
}
