import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Eye, Bookmark, Heart, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { MessageCircle } from "lucide-react"; 

interface InterestedUser {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profile?: { avatar?: string | null } | null;
  };
}
interface AnalyticsRow {
  date: string;
  views: number;
  bookmarks: number;
  interests: number;
  sources: Record<string, number> | null;
}

interface AnalyticsTotals {
  views: number;
  bookmarks: number;
  interests: number;
}

type Range = "7d" | "30d" | "90d";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${accent}`}>
              {value.toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <Icon className={`size-4 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectAnalyticsDashboardProps {
  projectId: string;
}

export default function ProjectAnalyticsDashboard({
  projectId,
}: ProjectAnalyticsDashboardProps) {
  const { showToast } = useToast();
  const [range, setRange] = useState<Range>("7d");
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [totals, setTotals] = useState<AnalyticsTotals>({
    views: 0,
    bookmarks: 0,
    interests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [geoTable, setGeoTable] = useState<
    { country: string; views: number }[]
  >([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/projects/${projectId}/analytics?range=${range}`,
      );
      setAnalytics(data.analytics || []);
      setTotals(data.totals || { views: 0, bookmarks: 0, interests: 0 });
      setGeoTable(data.geoTable || []);
    } catch {
      showToast({
        type: "error",
        title: "Failed to load analytics",
        message: "",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, range, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const chartData = analytics.map((row) => ({
    ...row,
    label: new Date(row.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const sourcesMap: Record<string, number> = {};
  analytics.forEach((row) => {
    if (row.sources) {
      Object.entries(row.sources).forEach(([key, val]) => {
        sourcesMap[key] = (sourcesMap[key] || 0) + val;
      });
    }
  });
  const pieData = Object.entries(sourcesMap).map(([name, value]) => ({
    name,
    value,
  }));

  const hasData =
    analytics.length > 0 &&
    (totals.views > 0 || totals.bookmarks > 0 || totals.interests > 0);

  const maxMetric =
    Math.max(totals.views, totals.bookmarks, totals.interests) || 1;

  const funnelItems = [
    {
      label: "Views",
      value: totals.views,
      color: "bg-indigo-500",
      pct: Math.round((totals.views / maxMetric) * 100),
    },
    {
      label: "Bookmarks",
      value: totals.bookmarks,
      color: "bg-purple-500",
      pct: Math.round((totals.bookmarks / maxMetric) * 100),
    },
    {
      label: "Interests",
      value: totals.interests,
      color: "bg-pink-500",
      pct: Math.round((totals.interests / maxMetric) * 100),
    },
  ];
const navigate = useNavigate();
const [showInterests, setShowInterests] = useState(false);
const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
const [loadingInterests, setLoadingInterests] = useState(false);

const fetchInterestedUsers = async () => {
  try {
    setLoadingInterests(true);
    const { data } = await api.get(`/bookmarks/interests/${projectId}`);
    setInterestedUsers(data);
    setShowInterests(true);
  } catch {
    showToast({ type: "error", title: "Failed to load interested users", message: "" });
  } finally {
    setLoadingInterests(false);
  }
};

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  const totalGeoViews = geoTable.reduce((sum, r) => sum + r.views, 0) || 1;
  return (
    <div className="space-y-6">
      {/* Header + range picker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {RANGE_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              variant="ghost"
              onClick={() => setRange(value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                range === value
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 bg-transparent"
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={totals.views}
          accent="text-indigo-600"
        />
        <StatCard
          icon={Bookmark}
          label="Bookmarks"
          value={totals.bookmarks}
          accent="text-purple-600"
        />
        <StatCard
          icon={Heart}
          label="Interests"
          value={totals.interests}
          accent="text-pink-600"
        />
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="size-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              No analytics data for this period yet. Views are tracked when the
              project is viewed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Line chart */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm text-gray-700">
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={chartData}
                  margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookmarks"
                    name="Bookmarks"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="interests"
                    name="Interests"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: "#ec4899", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement + Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Funnel */}
<Card className="border border-gray-200">
  <CardHeader className="pb-2 flex flex-row items-center justify-between">
    <CardTitle className="text-sm">Engagement Funnel</CardTitle>
    {totals.interests > 0 && (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-pink-600 gap-1"
        onClick={fetchInterestedUsers}
        disabled={loadingInterests}
      >
        <Heart className="size-3" />
        {loadingInterests ? "..." : "View"}
      </Button>
    )}
  </CardHeader>
              <CardContent className="space-y-3">
                {funnelItems.map(({ label, value, color, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {value.toLocaleString()}{" "}
                        <span className="text-gray-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sources pie */}
            {pieData.length > 0 ? (
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200 flex items-center justify-center">
                <CardContent className="py-8 text-center">
                  <p className="text-xs text-gray-400">
                    No source data available
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Geo table*/}
            {geoTable.length > 0 ? (
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="size-4 text-indigo-500" />
                    Views by Country
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {geoTable.slice(0, 6).map(({ country, views }) => {
                      const pct = Math.round((views / totalGeoViews) * 100);
                      return (
                        <div key={country} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-8 font-mono uppercase">
                            {country}
                          </span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 w-14 text-right">
                            {views}{" "}
                            <span className="text-gray-400">({pct}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200 flex items-center justify-center">
                <CardContent className="py-8 text-center">
                  <p className="text-xs text-gray-400">No geo data available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
      <Dialog open={showInterests} onOpenChange={setShowInterests}>
  <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Interested Users ({interestedUsers.length})</DialogTitle>
    </DialogHeader>
    <div className="space-y-3 py-2">
      {interestedUsers.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No one has expressed interest yet.
        </p>
      ) : (
        interestedUsers.map((interest) => (
          <div
            key={interest.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <Avatar className="size-10 flex-shrink-0">
              <AvatarImage src={interest.user.profile?.avatar ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                {interest.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{interest.user.name}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{interest.message}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(interest.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button
  size="sm"
  variant="outline"
  className="h-8 gap-1.5 text-xs flex-shrink-0"
  onClick={() => {
    setShowInterests(false);
    navigate("/app/conversation", { state: { otherUserId: interest.user.id } });
  }}
>
  <MessageCircle className="size-3.5" />
  Message
</Button>
          </div>
        ))
      )}
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}
