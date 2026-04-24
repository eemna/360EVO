import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Search,
  Briefcase,
  User,
  Star,
  Calendar,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import api from "../../services/axios";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet: string;
  meta: Record<string, unknown>;
  url: string;
  rank: number;
}

interface SearchResponse {
  q: string;
  type: string;
  results: {
    projects: SearchResult[];
    users: SearchResult[];
    experts: SearchResult[];
    events: SearchResult[];
    programs: SearchResult[];
  };
  pagination: {
    page: number;
    limit: number;
    totals: Record<string, number>;
  };
}

const TABS = [
  { key: "all", label: "All", Icon: Search },
  { key: "projects", label: "Projects", Icon: Briefcase },
  { key: "users", label: "People", Icon: User },
  { key: "experts", label: "Experts", Icon: Star },
  { key: "events", label: "Events", Icon: Calendar },
  { key: "programs", label: "Programs", Icon: BookOpen },
] as const;

const BADGE_COLORS: Record<string, string> = {
  project: "bg-blue-50 text-blue-700",
  user: "bg-purple-50 text-purple-700",
  expert: "bg-yellow-50 text-yellow-700",
  event: "bg-green-50 text-green-700",
  program: "bg-orange-50 text-orange-700",
};

function Highlighted({ html }: { html: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className="[&_mark]:bg-yellow-100 [&_mark]:text-yellow-800 [&_mark]:rounded-sm [&_mark]:px-0.5"
    />
  );
}

function MetaLine({ result }: { result: SearchResult }) {
  const m = result.meta;
  if (result.type === "project") {
    return (
      <span className="text-xs text-gray-500">
        {m.stage as string} · {m.industry as string}
        {m.owner ? ` · by ${m.owner as string}` : ""}
      </span>
    );
  }
  if (result.type === "expert") {
    return (
      <span className="text-xs text-gray-500">
        {(m.expertise as string[] | undefined)?.slice(0, 3).join(", ")}
        {m.hourlyRate ? ` · $${m.hourlyRate}/hr` : ""}
        {m.avgRating ? ` · ⭐ ${Number(m.avgRating).toFixed(1)}` : ""}
      </span>
    );
  }
  if (result.type === "event") {
    const date = m.date
      ? new Date(m.date as string).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";
    return (
      <span className="text-xs text-gray-500">
        {m.eventType as string} · {date} · {m.location as string}
        {Number(m.price) === 0 ? " · Free" : ` · $${m.price}`}
      </span>
    );
  }
  if (result.type === "program") {
    const deadline = m.deadline
      ? new Date(m.deadline as string).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "";
    return (
      <span className="text-xs text-gray-500">
        {m.programType as string} · Deadline {deadline}
        {Number(m.price) === 0 ? " · Free" : ` · $${m.price}`}
      </span>
    );
  }
  if (result.type === "user") {
    return (
      <span className="text-xs text-gray-500">
        {m.role as string}
        {m.location ? ` · ${m.location as string}` : ""}
      </span>
    );
  }
  return null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  project: <Briefcase className="w-4 h-4 text-blue-600" />,
  user: <User className="w-4 h-4 text-purple-600" />,
  expert: <Star className="w-4 h-4 text-yellow-500" />,
  event: <Calendar className="w-4 h-4 text-green-600" />,
  program: <BookOpen className="w-4 h-4 text-orange-600" />,
};

function ResultCard({ result }: { result: SearchResult }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(result.url)}
      className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
    >
      {result.type === "user" || result.type === "expert" ? (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {(result.meta.avatar as string) ? (
            <img
              src={result.meta.avatar as string}
              alt={`Avatar for ${result.title}`}
              className="w-full h-full object-cover"
            />
          ) : (
            ICON_MAP[result.type]
          )}
        </div>
      ) : (
        <div
          className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${BADGE_COLORS[result.type]}`}
        >
          {ICON_MAP[result.type]}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_COLORS[result.type]}`}
          >
            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
          <Highlighted html={result.title} />
        </h3>
        <MetaLine result={result} />
        {result.snippet && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            <Highlighted html={result.snippet} />
          </p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 bg-gray-100 rounded-full" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
        <div className="h-3 w-1/3 bg-gray-100 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const type = (searchParams.get("type") ?? "all") as string;
  const page = Number(searchParams.get("page") ?? "1");

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [localQ, setLocalQ] = useState(q);

  const doFetch = useCallback(async () => {
    if (!q.trim() || q.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await api.get("/search", {
        params: { q, type, page, limit: 10 },
      });
      setData(res.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [q, type, page]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);
  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const setTab = (t: string) => setSearchParams({ q, type: t, page: "1" });

  const setPage = (p: number) => {
    setSearchParams({ q, type, page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQ.trim()) setSearchParams({ q: localQ.trim(), type, page: "1" });
  };

  const allResults = data
    ? [
        ...data.results.projects,
        ...data.results.users,
        ...data.results.experts,
        ...data.results.events,
        ...data.results.programs,
      ].sort((a, b) => b.rank - a.rank)
    : [];

  const tabResults: Record<string, SearchResult[]> = {
    all: allResults,
    projects: data?.results.projects ?? [],
    users: data?.results.users ?? [],
    experts: data?.results.experts ?? [],
    events: data?.results.events ?? [],
    programs: data?.results.programs ?? [],
  };

  const currentResults = tabResults[type] ?? [];
  const totals = data?.pagination.totals ?? {};
  const totalPages = Math.ceil((totals[type] ?? totals.all ?? 0) / 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Search bar */}
        <form onSubmit={submitSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Search anything…"
            className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-gray-200 rounded-2xl shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </form>

        {q && (
          <p className="text-sm text-gray-500">
            {loading ? "Searching…" : `${totals.all ?? 0} results for `}
            {!loading && <strong className="text-gray-800">"{q}"</strong>}
          </p>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {TABS.map(({ key, label, Icon }) => {
            const count =
              key === "all" ? (totals.all ?? 0) : (totals[key] ?? 0);
            const active = type === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {data && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-blue-500" : "bg-gray-100 text-gray-500"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
          ) : currentResults.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-600">
                {q ? "No results found" : "Start searching"}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {q
                  ? "Try different keywords or switch tabs."
                  : "Type something in the search bar above."}
              </p>
            </div>
          ) : (
            currentResults.map((r) => (
              <ResultCard key={`${r.type}-${r.id}`} result={r} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
