import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import { TRLBadge } from "../components/ui/Aiassessmentsection";
import { Eye, Target, RefreshCw } from "lucide-react";

interface AIAssessment {
  trlScore: number;
  irScore: number;
}

interface Project {
  id: string;
  title: string;
  tagline: string;
  industry: string;
  stage: string;
  location?: string;
  fundingSought?: number;
  currency: string;
  viewCount: number;
  owner: { name: string; email: string };
  teamMembers: { id: string }[];
  aiAssessment?: AIAssessment | null;
}

interface Match {
  id: string;
  matchScore: number;
  status: "SUGGESTED" | "VIEWED" | "CONTACTED" | "DISMISSED";
  thesisAlignmentSummary?: string | null;
  categoryScores: Record<string, number>;
  reasoning: Record<string, unknown>;
  project: Project;
}

function matchScoreColor(score: number) {
  if (score >= 70)
    return { text: "text-green-600", bg: "bg-green-100 border-green-200" };
  if (score >= 40)
    return { text: "text-amber-600", bg: "bg-amber-100 border-amber-200" };
  return { text: "text-red-600", bg: "bg-red-100 border-red-200" };
}

function formatReasoningValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  return String(v);
}

const CATEGORY_META: Record<string, { label: string; max: number; color: string }> = {
  industry:   { label: "Industry",   max: 25, color: "#6366f1" },
  stage:      { label: "Stage",      max: 20, color: "#8b5cf6" },
  technology: { label: "Technology", max: 20, color: "#06b6d4" },
  funding:    { label: "Funding",    max: 15, color: "#f59e0b" },
  geography:  { label: "Geography",  max: 10, color: "#10b981" },
  irBonus:    { label: "IR Bonus",   max: 10, color: "#f97316" },
};

function CategoryScoreBar({ label, value, max = 25, color = "#6366f1" }: {
  label: string; value: number; max?: number; color?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className="text-xs font-mono font-semibold text-gray-700">
          {value}<span className="text-gray-400 font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MatchReasoningPanel({ match }: { match: Match | null }) {
  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Target className="w-8 h-8 text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">
          Select a match to see detailed reasoning
        </p>
      </div>
    );
  }

  const cats = match.categoryScores as Record<string, number>;
  const reasoning = match.reasoning as Record<string, unknown>;
const ORDER = ["industry", "stage", "technology", "funding", "geography", "irBonus"];
const POSITIVE_VALUES = new Set(["Exact", "Strong overlap", "Strong", "Match", "In range", "Semantic match", "Adjacent"]);
const NEGATIVE_VALUES = new Set(["Weak", "Mismatch", "Out of range", "Outside range"]);

const SKIP_KEYS = new Set([
  "thesisMembership",
  "_raw",
]);

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className={`text-3xl font-bold ${matchScoreColor(match.matchScore).text}`}>
          {match.matchScore}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Overall Match</p>
          <p className="text-xs text-gray-400 truncate max-w-[160px]">
            {match.project.title}
          </p>
        </div>
      </div>

      {/* Category scores */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Category Breakdown
        </p>
        <div className="space-y-3">

{ORDER.map((k) => {
  const v = cats[k];
  if (v === undefined) return null;

  const meta = CATEGORY_META[k];
  return (
    <CategoryScoreBar
      key={k}
      label={meta.label}
      value={v}
      max={meta.max}
      color={meta.color}
    />
  );
})}
        </div>

        {/* Total bar */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500"> Total (incl. IR bonus) </span>
          <span className={`text-sm font-bold ${matchScoreColor(match.matchScore).text}`}>
            {match.matchScore} / 100
          </span>
        </div>
      </div>

      {/* Reasoning flags */}
      {Object.keys(reasoning).filter(k => !SKIP_KEYS.has(k)).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Signals
          </p>
          <div className="space-y-2">
            {Object.entries(reasoning)
              .filter(([k]) => !SKIP_KEYS.has(k))
              .map(([k, v]) => {
                const formatted = formatReasoningValue(v);
                const isPositive = POSITIVE_VALUES.has(formatted);
                const isNegative = NEGATIVE_VALUES.has(formatted);
                return (
                  <div key={k} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-500 capitalize">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                      isPositive
                        ? "bg-green-50 text-green-700"
                        : isNegative
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-600"
                    }`}>
                      {formatted}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: Match["status"] }) {
  if (status === "SUGGESTED") return null;
  const styles = {
    VIEWED: "bg-blue-400",
    CONTACTED: "bg-green-500",
    DISMISSED: "bg-gray-300",
  };
  const labels = {
    VIEWED: "Viewed",
    CONTACTED: "Contacted",
    DISMISSED: "Dismissed",
  };
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${styles[status]}`}
      />
      {labels[status]}
    </span>
  );
}

function MatchCard({
  match,
  selected,
  onSelect,
  onDismiss,
}: {
  match: Match;
  selected: boolean;
  onSelect: () => void;
  onDismiss: (id: string) => void;
}) {
  const navigate = useNavigate();
  const col = matchScoreColor(match.matchScore);
  const dismissed = match.status === "DISMISSED";

  return (
    <div
      className={`bg-white rounded-2xl border transition-all cursor-pointer ${
        selected
          ? "border-indigo-400 shadow-md shadow-indigo-50"
          : "border-gray-200 hover:shadow-sm"
      } ${dismissed ? "opacity-50" : ""}`}
      onClick={onSelect}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {match.project.title}
              </h3>
              <StatusDot status={match.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs">
                {match.project.industry}
              </Badge>
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                {match.project.stage}
              </Badge>
              {match.project.aiAssessment && (
                <TRLBadge score={match.project.aiAssessment.trlScore} />
              )}
            </div>
            {match.thesisAlignmentSummary ? (
              <p className="text-xs text-gray-400 italic line-clamp-2">
                "{match.thesisAlignmentSummary}"
              </p>
            ) : (
              <p className="text-xs text-gray-300">
                No thesis alignment generated yet
              </p>
            )}
          </div>

          {/* Score ring */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="5"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={
                  match.matchScore >= 70
                    ? "#16a34a"
                    : match.matchScore >= 40
                      ? "#d97706"
                      : "#dc2626"
                }
                strokeWidth="5"
                strokeDasharray={`${(match.matchScore / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
              />
              <text
                x="28"
                y="28"
                textAnchor="middle"
                dominantBaseline="central"
                className={col.text}
                style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}
              >
                {match.matchScore}
              </text>
            </svg>
            <span className="text-xs text-gray-400 font-mono">Match</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              if (match.status === "SUGGESTED") {
                api
                  .put(`/ai/matches/${match.id}/status`, { status: "VIEWED" })
                  .catch(() => {});
              }
              navigate(
                `/app/startup/projects/${match.project.id}?source=match_feed`,
              );
            }}
          >
            <Eye className="w-3 h-3 mr-1" /> View Project
          </Button>
          {!dismissed && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 text-gray-400 hover:text-red-500 hover:border-red-200"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(match.id);
              }}
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatchFeedPage() {
  const { showToast } = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "dismissed">(
    "active",
  );
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/ai/matches/feed?dismissed=true");
      setMatches(data);
    } catch {
      showToast({
        type: "error",
        title: "Failed to load matches",
        message: "",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await api.post("/ai/matches/generate");

      const { data: initial } = await api.get("/ai/matches/feed");
      setMatches(initial);

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: fresh } = await api.get("/ai/matches/feed");
        setMatches(fresh);

        const hasThesis = fresh.some((m: Match) => m.thesisAlignmentSummary);
        if (hasThesis || attempts >= 8) {
          clearInterval(poll);
          setGenerating(false);
          showToast({
            type: "success",
            title: hasThesis
              ? "Matches ready with AI summaries"
              : "Matches generated",
            message: hasThesis
              ? "Thesis alignment complete."
              : "AI summaries will appear shortly.",
          });
        }
      }, 4000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Generation failed";
      showToast({ type: "error", title: "Error", message: msg });
      setGenerating(false);
    }
  };

  const handleDismiss = async (matchId: string) => {
    try {
      await api.put(`/ai/matches/${matchId}/status`, { status: "DISMISSED" });
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "DISMISSED" } : m)),
      );
      if (selectedMatch?.id === matchId) setSelectedMatch(null);
    } catch {
      showToast({ type: "error", title: "Failed to dismiss", message: "" });
    }
  };

  const filtered = matches.filter((m) => {
    if (filter === "active") return m.status !== "DISMISSED";
    if (filter === "dismissed") return m.status === "DISMISSED";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Match Feed</h1>
          <p className="text-gray-500 text-sm mt-1">
             Score = Industry + Stage + Tech + Funding + Geo (90) + IR Bonus (10)
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          {generating ? (
            <>
              <LoadingSpinner size="sm" /> Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" /> Refresh Matches
            </>
          )}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["active", "all", "dismissed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              filter === f
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {f === "active"
              ? "Active"
              : f === "all"
                ? "All Matches"
                : "Dismissed"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-5 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {matches.length === 0
                    ? "No matches yet. Click Refresh Matches to generate."
                    : "No matches in this category."}
                </p>
              </div>
            ) : (
              filtered.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  selected={selectedMatch?.id === m.id}
                  onSelect={() => setSelectedMatch(m)}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </div>

          {/* Reasoning panel */}
          <div className="sticky top-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-sm">Match Reasoning</CardTitle>
              </CardHeader>
              <CardContent>
                <MatchReasoningPanel match={selectedMatch} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
