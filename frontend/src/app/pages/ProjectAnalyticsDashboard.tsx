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

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/projects/${projectId}/analytics?range=${range}`,
      );
      setAnalytics(data.analytics || []);
      setTotals(data.totals || { views: 0, bookmarks: 0, interests: 0 });
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

  // ✅ Computed OUTSIDE JSX
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Funnel */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Engagement Funnel</CardTitle>
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
          </div>
        </>
      )}
    </div>
  );
}
