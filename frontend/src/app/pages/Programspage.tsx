import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import api from "../../services/axios";
import {
  Rocket,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface Program {
  id: string;
  title: string;
  description: string;
  type: "INCUBATION" | "ACCELERATION" | "MENTORSHIP";
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  capacity: number;
  status: "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED";
  coverImage: string | null;
  organizer: { name: string };
  _count: { applications: number; participants: number };
  price: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const TYPE_CONFIG = {
  INCUBATION: {
    label: "Incubation",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: BookOpen,
  },
  ACCELERATION: {
    label: "Acceleration",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Rocket,
  },
  MENTORSHIP: {
    label: "Mentorship",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: TrendingUp,
  },
};

const STATUS_CONFIG = {
  OPEN: { label: "Open", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-600" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  DRAFT: { label: "Draft", color: "bg-yellow-100 text-yellow-700" },
};

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProgramCard({
  program,
  isAdmin,
}: {
  program: Program;
  isAdmin: boolean;
}) {
  const navigate = useNavigate();
  const TypeIcon = TYPE_CONFIG[program.type].icon;
  const days = daysUntil(program.applicationDeadline);
  const isUrgent = days >= 0 && days <= 7 && program.status === "OPEN";
  const spotsLeft = program.capacity - program._count.participants;

  return (
    <Card
      className="border border-gray-200 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
      onClick={() => navigate(`/app/programs/${program.id}`)}
    >
      <div className="h-24 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
        {program.coverImage ? (
          <img
            src={program.coverImage}
            alt={program.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="size-10 text-indigo-200" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_CONFIG[program.status].color}`}
          >
            {STATUS_CONFIG[program.status].label}
          </span>
        </div>
      </div>

      <CardContent className="pt-3 pb-4 space-y-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_CONFIG[program.type].color}`}
        >
          <TypeIcon className="size-3" />
          {TYPE_CONFIG[program.type].label}
        </span>

        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          {program.title}
        </h3>

        <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed">
          {program.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formatDate(program.startDate)}
          </span>
            <span className="flex items-center gap-1">
     {Number(program.price) === 0 ? "Free" : `$${Number(program.price).toFixed(2)}`}

  </span>
        </div>

        {program.status === "OPEN" && days >= 0 && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 ${
              isUrgent ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
            }`}
          >
            <Clock className="size-3 flex-shrink-0" />
            {days === 0 ? "Deadline today!" : `${days} days left to apply`}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">
            by {program.organizer.name}
          </span>
          <ChevronRight className="size-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
        </div>

        {isAdmin && (
          <div
            className="flex gap-3 pt-2 border-t border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => navigate(`/app/programs/${program.id}/edit`)}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Edit
            </button>
            <button
              onClick={() =>
                navigate(`/app/admin/programs/${program.id}/applications`)
              }
              className="text-xs text-gray-400 hover:underline"
            >
              {program._count.applications} applications
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgramCardSkeleton() {
  return (
    <Card className="border border-gray-200 overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <CardContent className="pt-4 space-y-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function ProgramsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [programs, setPrograms] = useState<Program[]>([]);
  const [myPrograms, setMyPrograms] = useState<Program[]>([]);
  const [showMine, setShowMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get("/programs", {
          params: {
            type: typeFilter !== "all" ? typeFilter : undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: search.trim() || undefined,
            page,
            limit: 12,
          },
        });
        setPrograms(res.data);
        setPagination(res.pagination);
      } catch {
        setPrograms([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [typeFilter, statusFilter, page, search]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get("/admin/programs")
      .then(({ data }) => setMyPrograms(data?.data ?? data))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, search]);

  const stats = {
    open: programs.filter((p) => p.status === "OPEN").length,
    total: programs.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Programs</h1>
          <p className="text-gray-500 text-sm mt-1">
            Incubation, acceleration, and mentorship programs for startups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-indigo-600">{stats.open}</span>{" "}
            open programs
          </span>
          {isAdmin && (
            <button
              onClick={() => navigate("/app/programs/create")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="size-4" /> Create
            </button>
          )}
        </div>
      </div>

      {/* Admin tabs: All Programs / My Programs */}
      {isAdmin && (
        <div className="flex gap-2 border-b border-gray-200 pb-1">
          <button
            onClick={() => setShowMine(false)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              !showMine
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All Programs
          </button>
          <button
            onClick={() => setShowMine(true)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              showMine
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            My Programs ({myPrograms.length})
          </button>
        </div>
      )}

      {/* Filters — only shown on "All Programs" tab */}
      {!showMine && (
        <>
          {/* Type filter pills */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {(["all", "INCUBATION", "ACCELERATION", "MENTORSHIP"] as const).map(
              (type) => {
                if (type === "all") {
                  return (
                    <button
                      key={type}
                      onClick={() => setTypeFilter("all")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${typeFilter === "all" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <p className="font-semibold text-sm text-gray-900">
                        All Programs
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {stats.total} total
                      </p>
                    </button>
                  );
                }
                const cfg = TYPE_CONFIG[type];
                const Icon = cfg.icon;
                const count = programs.filter((p) => p.type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${typeFilter === type ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="size-4 text-indigo-600" />
                      <p className="font-semibold text-sm text-gray-900">
                        {cfg.label}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{count} programs</p>
                  </button>
                );
              },
            )}
          </div>

          {/* Search + status filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                {isAdmin && <SelectItem value="DRAFT">Draft</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Program grid */}
      {showMine && isAdmin ? (
        myPrograms.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <BookOpen className="size-10 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              No programs yet
            </h3>
            <p className="text-sm text-gray-400">Create your first program</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {myPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} isAdmin={isAdmin} />
            ))}
          </div>
        )
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {[...Array(6)].map((_, i) => (
            <ProgramCardSkeleton key={i} />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <CheckCircle2 className="size-10 text-gray-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            No programs found
          </h3>
          <p className="text-sm text-gray-400">
            {search
              ? "Try different search terms"
              : "No programs match these filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {!showMine && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="size-4" /> Prev
          </button>
          <span className="text-sm text-gray-500">
            {page} / {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}