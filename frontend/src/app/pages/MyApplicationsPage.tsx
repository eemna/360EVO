import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
//import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../../context/ToastContext";
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
} from "lucide-react";

interface ProgramApplication {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  submittedAt: string;
  responses: {
    motivation?: string;
    experience?: string;
    goals?: string;
  };
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

const TYPE_CONFIG = {
  INCUBATION: { label: "Incubation", icon: BookOpen, color: "bg-blue-100 text-blue-700" },
  ACCELERATION: { label: "Acceleration", icon: Rocket, color: "bg-orange-100 text-orange-700" },
  MENTORSHIP: { label: "Mentorship", icon: TrendingUp, color: "bg-green-100 text-green-700" },
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

function ApplicationCard({ app }: { app: ProgramApplication }) {
  const navigate = useNavigate();
  const TypeIcon = TYPE_CONFIG[app.program.type].icon;
  const statusCfg = STATUS_CONFIG[app.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="border border-gray-200 hover:shadow-sm transition-shadow">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Type icon */}
          <div
            className={`p-2.5 rounded-xl flex-shrink-0 ${TYPE_CONFIG[app.program.type].color}`}
          >
            <TypeIcon className="size-5" />
          </div>

          {/* Info */}
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
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_CONFIG[app.program.type].color}`}>
                {TYPE_CONFIG[app.program.type].label}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Starts {formatDate(app.program.startDate)}
              </span>
              <span>by {app.program.organizer.name}</span>
            </div>

            {/* Motivation preview */}
            {app.responses?.motivation && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic">
                "{app.responses.motivation}"
              </p>
            )}

            <p className="text-xs text-gray-400 mt-1">
              Applied {formatDate(app.submittedAt)}
            </p>
          </div>

          {/* Action */}
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 gap-1"
            onClick={() => navigate(`/app/programs/${app.program.id}`)}
          >
            View Program
            <ChevronRight className="size-3" />
          </Button>
        </div>

        {/* Accepted banner */}
        {app.status === "ACCEPTED" && (
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Congratulations! You've been accepted. Check your notifications for next steps.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyApplicationsPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<ProgramApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/programs/my-applications");
        setApplications(data);
      } catch {
        showToast({ type: "error", title: "Failed to load applications", message: "" });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [showToast]);

  const filtered =
    filter === "ALL" ? applications : applications.filter((a) => a.status === filter);

  const counts = {
    ALL: applications.length,
    PENDING: applications.filter((a) => a.status === "PENDING").length,
    ACCEPTED: applications.filter((a) => a.status === "ACCEPTED").length,
    REJECTED: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">My Applications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your program applications and their status
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f === "ALL" ? "All" : STATUS_CONFIG[f]?.label ?? f}{" "}
            <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSearch className="size-10 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {filter === "ALL" ? "No applications yet" : `No ${filter.toLowerCase()} applications`}
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
          {filtered.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}