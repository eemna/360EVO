import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
//import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import {
  Target,
  TrendingUp,
  RefreshCw,
  Settings2,
  ChevronRight,
  BarChart3,
  Globe,
  Layers,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen
} from "lucide-react";
import { FolderOpen, FileSearch } from "lucide-react";

interface InvestorProfile {
  industries: string[];
  stages: string[];
  technologies: string[];
  fundingMin: string | number | null;
  fundingMax: string | number | null;
  currency: string;
  geographicPrefs: string[];
  riskTolerance: "LOW" | "MEDIUM" | "HIGH";
  dealStructures: string[];
  investmentThesis: string;
}

interface Match {
  id: string;
  matchScore: number;
  status: "SUGGESTED" | "VIEWED" | "CONTACTED" | "DISMISSED";
  thesisAlignmentSummary?: string | null;
  project: {
    id: string;
    title: string;
    industry: string;
    stage: string;
    tagline?: string;
  };
}
interface DdRequestSent {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
  project: { id: string; title: string };
  dataRoom: { id: string; expiresAt: string } | null;
}
function scoreColor(score: number) {
  if (score >= 70)
    return {
      text: "text-green-600",
      ring: "#16a34a",
      bg: "bg-green-50 border-green-200",
    };
  if (score >= 40)
    return {
      text: "text-amber-600",
      ring: "#d97706",
      bg: "bg-amber-50 border-amber-200",
    };
  return {
    text: "text-red-600",
    ring: "#dc2626",
    bg: "bg-red-50 border-red-200",
  };
}

function riskColor(r: string) {
  if (r === "HIGH") return "bg-red-100 text-red-700";
  if (r === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const cx = size / 2;
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const { ring } = scoreColor(score);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={size * 0.1}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={ring}
        strokeWidth={size * 0.1}
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text
        x={cx}
        y={cx}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: "inherit",
          fontSize: size * 0.26,
          fontWeight: 700,
          fill: ring,
        }}
      >
        {score}
      </text>
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-gray-50`}>
            <Icon className={`size-4 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopMatchRow({
  match,
  onClick,
}: {
  match: Match;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      <ScoreRing score={match.matchScore} size={44} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
          {match.project.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {match.project.industry}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {match.project.stage}
          </span>
        </div>
        {match.thesisAlignmentSummary && (
          <p className="text-xs text-gray-400 italic mt-1 line-clamp-1">
            "{match.thesisAlignmentSummary}"
          </p>
        )}
      </div>
      <ChevronRight className="size-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
    </div>
  );
}

function SetupChecklist({ profile }: { profile: InvestorProfile | null }) {
  const items = [
    {
      label: "Industries selected",
      done: (profile?.industries?.length ?? 0) > 0,
    },
    { label: "Stages configured", done: (profile?.stages?.length ?? 0) > 0 },
    {
      label: "Funding range set",
      done: !!profile?.fundingMin || !!profile?.fundingMax,
    },
    {
      label: "Geography preferences",
      done: (profile?.geographicPrefs?.length ?? 0) > 0,
    },
    {
      label: "Investment thesis written",
      done: (profile?.investmentThesis?.length ?? 0) > 50,
    },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">
          Profile completeness
        </span>
        <span className="text-xs font-bold text-indigo-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-1.5 mt-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.done ? (
              <CheckCircle2 className="size-3.5 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="size-3.5 text-gray-300 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${item.done ? "text-gray-600" : "text-gray-400"}`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ddRequests, setDdRequests] = useState<DdRequestSent[]>([]);
  const [loadingDd, setLoadingDd] = useState(true);
  useEffect(() => {
    api
      .get("/dd-requests/sent")
      .then(({ data }) => setDdRequests(data))
      .catch(() => setDdRequests([]))
      .finally(() => setLoadingDd(false));
  }, []);
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/investor-profile");
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/ai/matches/feed");
        setMatches(data);
      } catch {
        setMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetch();
  }, []);

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

  const activeMatches = matches.filter((m) => m.status !== "DISMISSED");
  const highMatches = activeMatches.filter((m) => m.matchScore >= 70);
  const topMatches = [...activeMatches]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  const avgScore =
    activeMatches.length > 0
      ? Math.round(
          activeMatches.reduce((s, m) => s + m.matchScore, 0) /
            activeMatches.length,
        )
      : 0;

  {
    /*const profileComplete =
    profile &&
    (profile.industries?.length ?? 0) > 0 &&
    (profile.stages?.length ?? 0) > 0 &&
    (profile.investmentThesis?.length ?? 0) > 50; */
  }

  const loading = loadingProfile || loadingMatches;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Your AI-powered investor workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/app/investor/setup")}
            className="gap-2"
          >
            <Settings2 className="size-4" />
            Edit Preferences
          </Button>
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
                <RefreshCw className="size-4" /> Refresh Matches
              </>
            )}
          </Button>
        </div>
      </div>

      {/* No profile banner */}
      {/* !loadingProfile && !profileComplete && (
        <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Zap className="size-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900 text-sm">
                Complete your investor profile to unlock AI matching
              </p>
              <p className="text-xs text-indigo-600 mt-0.5">
                Add your thesis, sectors, and preferences so we can find the
                best projects for you.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/app/investor/setup")}
            className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
          >
            Set Up Profile →
          </Button>
        </div>
      ) */}

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Active Matches"
            value={activeMatches.length}
            sub={
              matches.length > 0
                ? `${matches.length} total`
                : "Generate to start"
            }
            accent="text-indigo-600"
          />
          <StatCard
            icon={TrendingUp}
            label="High Confidence"
            value={highMatches.length}
            sub="Score ≥ 70"
            accent="text-green-600"
          />
          <StatCard
            icon={BarChart3}
            label="Avg Match Score"
            value={avgScore > 0 ? `${avgScore}` : "—"}
            sub={
              activeMatches.length > 0
                ? `across ${activeMatches.length} matches`
                : "No matches yet"
            }
            accent="text-amber-600"
          />
          <StatCard
            icon={Layers}
            label="Sectors Tracked"
            value={profile?.industries?.length ?? 0}
            sub={`${profile?.stages?.length ?? 0} stages`}
            accent="text-purple-600"
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Matches */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Top Matches</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app/investor/matches")}
                className="text-xs text-indigo-600 hover:text-indigo-700 gap-1"
              >
                View all <ChevronRight className="size-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingMatches ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : topMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="size-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No matches yet</p>
                  {/*{profileComplete ? ( */}
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                  >
                    {generating ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <RefreshCw className="size-3" />
                    )}
                    Generate Matches
                  </Button>
                  {/* ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/app/investor/setup")}
                    >
                      Complete Profile First →
                    </Button>
                  )}*/}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {topMatches.map((m) => (
                    <TopMatchRow
                      key={m.id}
                      match={m}
                      onClick={() => {
                        if (m.status === "SUGGESTED") {
                          api
                            .put(`/ai/matches/${m.id}/status`, {
                              status: "VIEWED",
                            })
                            .catch(() => {});
                        }
                        navigate(
                          `/app/startup/projects/${m.project.id}?source=match_feed`,
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/app/investor/matches")}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="p-2.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <Target className="size-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Match Feed
                </p>
                <p className="text-xs text-gray-400">
                  Browse all AI-scored matches
                </p>
              </div>
              <ChevronRight className="size-4 text-gray-300 ml-auto group-hover:text-indigo-400 transition-colors" />
            </button>

            <button
              onClick={() => navigate("/app/projects")}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Globe className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Project Gallery
                </p>
                <p className="text-xs text-gray-400">
                  Browse all startup projects
                </p>
              </div>
              <ChevronRight className="size-4 text-gray-300 ml-auto group-hover:text-purple-400 transition-colors" />
            </button>
            <button
              onClick={() => navigate("/app/investor/dd-requests")}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="p-2.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                <FolderOpen className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Due Diligence
                </p>
                <p className="text-xs text-gray-400">Your data room requests</p>
              </div>
              <ChevronRight className="size-4 text-gray-300 ml-auto group-hover:text-green-400 transition-colors" />
            </button>
            <button
              onClick={() => navigate("/app/events/my")}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Calendar className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">My Events</p>
                <p className="text-xs text-gray-400">Your registered events</p>
              </div>
              <ChevronRight className="size-4 text-gray-300 ml-auto group-hover:text-indigo-400 transition-colors" />
            </button>
                      <button
  onClick={() => navigate("/app/programs/my-applications")}
  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
>
  <div className="p-2.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
    <BookOpen className="size-5 text-indigo-600" />
  </div>
  <div>
    <p className="text-sm font-semibold text-gray-900">My Applications</p>
    <p className="text-xs text-gray-400">Programs you've applied to</p>
  </div>
  <ChevronRight className="size-4 text-gray-300 ml-auto group-hover:text-indigo-400 transition-colors" />
</button>
          </div>

        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Profile completeness */}
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Profile Setup</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app/investor/setup")}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Edit
              </Button>
            </CardHeader>

            <CardContent>
              {loadingProfile ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <SetupChecklist profile={profile} />
              )}
            </CardContent>
          </Card>
          {/* DD Requests — approved data rooms */}
          {!loadingDd &&
            ddRequests.filter((r) => r.status === "APPROVED").length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="size-4 text-green-600" />
                    Active Data Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ddRequests
                    .filter((r) => r.status === "APPROVED" && r.dataRoom)
                    .slice(0, 3)
                    .map((req) => {
                      const daysLeft = Math.max(
                        0,
                        Math.floor(
                          (new Date(req.dataRoom!.expiresAt).getTime() -
                            Date.now()) /
                            86400000,
                        ),
                      );
                      return (
                        <button
                          key={req.id}
                          onClick={() =>
                            navigate(
                              `/app/investor/data-rooms/${req.dataRoom!.id}`,
                            )
                          }
                          className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all text-left group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {req.project.title}
                            </p>
                            <p
                              className={`text-xs mt-0.5 ${daysLeft <= 3 ? "text-red-500" : "text-gray-400"}`}
                            >
                              {daysLeft === 0
                                ? "Expires today"
                                : `${daysLeft}d left`}
                            </p>
                          </div>
                          <ChevronRight className="size-3 text-gray-300 group-hover:text-green-500 flex-shrink-0 ml-2" />
                        </button>
                      );
                    })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-green-600 hover:text-green-700 mt-1"
                    onClick={() => navigate("/app/investor/dd-requests")}
                  >
                    View all requests →
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Pending DD requests badge */}
          {!loadingDd &&
            ddRequests.filter((r) => r.status === "PENDING").length > 0 && (
              <div
                className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => navigate("/app/investor/dd-requests")}
              >
                <FileSearch className="size-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">
                    {ddRequests.filter((r) => r.status === "PENDING").length}
                  </span>{" "}
                  DD request
                  {ddRequests.filter((r) => r.status === "PENDING").length > 1
                    ? "s"
                    : ""}{" "}
                  pending approval
                </p>
                <ChevronRight className="size-3 text-amber-400 ml-auto" />
              </div>
            )}
          {/* Investment preferences summary */}
          {!loadingProfile && profile && (
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">My Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Risk */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Risk Tolerance</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskColor(profile.riskTolerance)}`}
                  >
                    {profile.riskTolerance}
                  </span>
                </div>

                {/* Ticket size */}
                {(profile.fundingMin || profile.fundingMax) && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">
                      Ticket Size
                    </span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {profile.fundingMin
                        ? `$${Number(profile.fundingMin).toLocaleString()}`
                        : "—"}
                      {" – "}
                      {profile.fundingMax
                        ? `$${Number(profile.fundingMax).toLocaleString()}`
                        : "—"}
                    </span>
                  </div>
                )}

                {/* Sectors */}
                {profile.industries?.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1.5">
                      Sectors
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {profile.industries.slice(0, 4).map((i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {i}
                        </span>
                      ))}
                      {profile.industries.length > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          +{profile.industries.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stages */}
                {profile.stages?.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1.5">
                      Stages
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {profile.stages.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geography */}
                {profile.geographicPrefs?.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1.5">
                      Geography
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {profile.geographicPrefs.map((g) => (
                        <span
                          key={g}
                          className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs mt-2"
                  onClick={() => navigate("/app/investor/setup")}
                >
                  <Settings2 className="size-3 mr-1.5" />
                  Update Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Thesis snippet */}
          {!loadingProfile && profile?.investmentThesis && (
            <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-indigo-900">
                  Investment Thesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-indigo-700 leading-relaxed line-clamp-4">
                  {profile.investmentThesis}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-indigo-600 hover:text-indigo-700 px-0 mt-2"
                  onClick={() => navigate("/app/investor/setup")}
                >
                  Edit thesis →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
