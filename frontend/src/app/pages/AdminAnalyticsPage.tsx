import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  TrendingUp,
  Users,
  FolderOpen,
  DollarSign,
  Calendar,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../../services/axios";

// ── Types ──────────────────────────────────────────────

type GrowthRow = { period: string; role: string; count: number };
type EngagementRow = { period: string; count: number };
type ProjectStatusRow = { period: string; status: string; count: number };
type EngagementData = {
  projectsByStatus: ProjectStatusRow[];
  matches: EngagementRow[];
  messages: EngagementRow[];
  dataRoomActivity: EngagementRow[];
  activeUsers: EngagementRow[];
};

type RevenueAnalyticsRow = {
  period: string;
  referenceType: string;
  total: number;
  count: number;
};

type EventProgramAnalytics = {
  eventRegistrations: { period: string; registrations: number }[];
  eventApplications: { period: string; status: string; count: number }[];
  programApplications: { period: string; status: string; count: number }[];
  eventFillRates: {
    id: string;
    title: string;
    capacity: number;
    registrations: number;
    fillRate: number;
  }[];
  programFillRates: {
    id: string;
    title: string;
    capacity: number;
    participants: number;
    applications: number;
    fillRate: number;
  }[];
};

type TimeRange = "daily" | "weekly" | "monthly";

export default function AdminAnalyticsPage() {
  // ── Global time range controls ──────────────────────
  const [growthRange, setGrowthRange] = useState<TimeRange>("monthly");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [useCustomRange, setUseCustomRange] = useState(false);

  const rangeParams = useMemo(
    () => ({
      range: growthRange,
      ...(useCustomRange && customStartDate && customEndDate
        ? { startDate: customStartDate, endDate: customEndDate }
        : {}),
    }),
    [growthRange, useCustomRange, customStartDate, customEndDate],
  );

  const formatPeriodLabel = useCallback(
    (period: string) =>
      new Date(period).toLocaleDateString("en-US", {
        month: "short",
        day: growthRange === "monthly" ? undefined : "numeric",
        year: "numeric",
      }),
    [growthRange],
  );

  // ── Growth — Sign-ups by Role ────────────────────────
  const [growthData, setGrowthData] = useState<GrowthRow[]>([]);
  const [growthLoading, setGrowthLoading] = useState(false);

  const fetchGrowth = useCallback(async () => {
    setGrowthLoading(true);
    try {
      const { data } = await api.get("/admin/analytics/growth", {
        params: rangeParams,
      });
      setGrowthData(data);
    } catch {
      setGrowthData([]);
    } finally {
      setGrowthLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => {
    fetchGrowth();
  }, [fetchGrowth]);

  const formatGrowthForChart = (rows: GrowthRow[]) => {
    const byPeriod: Record<string, Record<string, number | string>> = {};
    rows.forEach((row) => {
      const label = formatPeriodLabel(row.period);
      if (!byPeriod[label]) byPeriod[label] = { period: label };
      byPeriod[label][row.role] = row.count;
    });
    return Object.values(byPeriod);
  };

  // ── Engagement ────────────────────────────────────────
  const [engagementData, setEngagementData] = useState<EngagementData | null>(
    null,
  );
  const [engagementLoading, setEngagementLoading] = useState(false);

  const fetchEngagement = useCallback(async () => {
    setEngagementLoading(true);
    try {
      const { data } = await api.get("/admin/analytics/engagement", {
        params: rangeParams,
      });
      setEngagementData(data);
    } catch {
      setEngagementData(null);
    } finally {
      setEngagementLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => {
    fetchEngagement();
  }, [fetchEngagement]);

  const formatSimpleForChart = (rows: EngagementRow[]) =>
    rows.map((row) => ({
      period: formatPeriodLabel(row.period),
      count: row.count,
    }));

  const formatProjectStatusForChart = (rows: ProjectStatusRow[]) => {
    const byPeriod: Record<string, Record<string, number | string>> = {};
    rows.forEach((row) => {
      const label = formatPeriodLabel(row.period);
      if (!byPeriod[label]) byPeriod[label] = { period: label };
      byPeriod[label][row.status] = row.count;
    });
    return Object.values(byPeriod);
  };

  // ── Revenue by Source ─────────────────────────────────
  const [revenueAnalyticsData, setRevenueAnalyticsData] = useState<
    RevenueAnalyticsRow[]
  >([]);
  const [revenueAnalyticsLoading, setRevenueAnalyticsLoading] = useState(false);

  const fetchRevenueAnalytics = useCallback(async () => {
    setRevenueAnalyticsLoading(true);
    try {
      const { data } = await api.get("/admin/analytics/revenue", {
        params: rangeParams,
      });
      setRevenueAnalyticsData(data);
    } catch {
      setRevenueAnalyticsData([]);
    } finally {
      setRevenueAnalyticsLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => {
    fetchRevenueAnalytics();
  }, [fetchRevenueAnalytics]);

  const formatRevenueForChart = (rows: RevenueAnalyticsRow[]) => {
    const byPeriod: Record<string, Record<string, number | string>> = {};
    rows.forEach((row) => {
      const label = formatPeriodLabel(row.period);
      if (!byPeriod[label]) byPeriod[label] = { period: label };
      byPeriod[label][row.referenceType] = row.total;
    });
    return Object.values(byPeriod);
  };

  const totalTransactionCount = revenueAnalyticsData.reduce(
    (sum, r) => sum + r.count,
    0,
  );

  // ── Events & Programs ──────────────────────────────────
  const [eventProgramData, setEventProgramData] =
    useState<EventProgramAnalytics | null>(null);
  const [eventProgramLoading, setEventProgramLoading] = useState(false);

  const fetchEventProgramAnalytics = useCallback(async () => {
    setEventProgramLoading(true);
    try {
      const { data } = await api.get("/admin/analytics/events-programs", {
        params: rangeParams,
      });
      setEventProgramData(data);
    } catch {
      setEventProgramData(null);
    } finally {
      setEventProgramLoading(false);
    }
  }, [rangeParams]);

  useEffect(() => {
    fetchEventProgramAnalytics();
  }, [fetchEventProgramAnalytics]);

  const formatEventsProgramsForChart = (data: EventProgramAnalytics) => {
    const byPeriod: Record<string, Record<string, number | string>> = {};

    data.eventRegistrations.forEach((row) => {
      const key = formatPeriodLabel(row.period);
      if (!byPeriod[key]) byPeriod[key] = { period: key };
      byPeriod[key]["registrations"] = row.registrations;
    });

    data.eventApplications.forEach((row) => {
      const key = formatPeriodLabel(row.period);
      if (!byPeriod[key]) byPeriod[key] = { period: key };
      byPeriod[key][`Event ${row.status}`] = row.count;
    });

    data.programApplications.forEach((row) => {
      const key = formatPeriodLabel(row.period);
      if (!byPeriod[key]) byPeriod[key] = { period: key };
      byPeriod[key][`Program ${row.status}`] = row.count;
    });

    return Object.values(byPeriod);
  };

  const totalEventApplications = useMemo(
    () =>
      eventProgramData?.eventApplications.reduce(
        (sum, r) => sum + r.count,
        0,
      ) ?? 0,
    [eventProgramData],
  );

  const totalProgramApplications = useMemo(
    () =>
      eventProgramData?.programApplications.reduce(
        (sum, r) => sum + r.count,
        0,
      ) ?? 0,
    [eventProgramData],
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Understand trends across the 360EVO platform
        </p>
      </div>

      {/* ── Global time range controls ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Time range:</span>
          <Select
            value={growthRange}
            onValueChange={(v) => setGrowthRange(v as TimeRange)}
            disabled={useCustomRange}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => {
              setCustomStartDate(e.target.value);
              setUseCustomRange(true);
            }}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => {
              setCustomEndDate(e.target.value);
              setUseCustomRange(true);
            }}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          />
          {useCustomRange && (
            <button
              onClick={() => {
                setUseCustomRange(false);
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Growth ── */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Growth — Sign-ups by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
            </div>
          ) : growthData.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <TrendingUp className="size-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No sign-up data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatGrowthForChart(growthData)}>
                <XAxis
                  dataKey="period"
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
                <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="STARTUP"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="INVESTOR"
                  stroke="#eab308"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="EXPERT"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="MEMBER"
                  stroke="#a855f7"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Engagement — Active Users ── */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Engagement — Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {engagementLoading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
            </div>
          ) : !engagementData || engagementData.activeUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Users className="size-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No activity data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={formatSimpleForChart(engagementData.activeUsers)}
              >
                <XAxis
                  dataKey="period"
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
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Projects Submitted vs Approved vs Rejected ── */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="size-4 text-primary" />
            Projects — Submitted vs Approved vs Rejected
          </CardTitle>
        </CardHeader>
        <CardContent>
          {engagementLoading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
            </div>
          ) : !engagementData ||
            engagementData.projectsByStatus.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FolderOpen className="size-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No project data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={formatProjectStatusForChart(
                  engagementData.projectsByStatus,
                )}
              >
                <XAxis
                  dataKey="period"
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
                <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="PENDING"
                  stroke="#eab308"
                  strokeWidth={2}
                  name="Submitted"
                />
                <Line
                  type="monotone"
                  dataKey="APPROVED"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Approved"
                />
                <Line
                  type="monotone"
                  dataKey="REJECTED"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Rejected"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── AI Matches / Messages / Data Room / Revenue grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-purple-600" />
              AI Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {engagementLoading ? (
              <div className="py-8 text-center text-gray-400">
                <Loader2 className="size-5 mx-auto animate-spin" />
              </div>
            ) : !engagementData || engagementData.matches.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No matches yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={formatSimpleForChart(engagementData.matches)}>
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
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
                    dataKey="count"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-green-600" />
              Messages Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {engagementLoading ? (
              <div className="py-8 text-center text-gray-400">
                <Loader2 className="size-5 mx-auto animate-spin" />
              </div>
            ) : !engagementData || engagementData.messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No messages yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={formatSimpleForChart(engagementData.messages)}>
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
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
                    dataKey="count"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="size-4 text-amber-600" />
              Data Room Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {engagementLoading ? (
              <div className="py-8 text-center text-gray-400">
                <Loader2 className="size-5 mx-auto animate-spin" />
              </div>
            ) : !engagementData ||
              engagementData.dataRoomActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No activity yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={formatSimpleForChart(engagementData.dataRoomActivity)}
                >
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
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
                    dataKey="count"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Revenue by Source ── */}
        <Card className="border border-gray-200 md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="size-4 text-green-600" />
              Revenue by Source
            </CardTitle>
            <span className="text-sm text-gray-500">
              {totalTransactionCount} transactions
            </span>
          </CardHeader>
          <CardContent>
            {revenueAnalyticsLoading ? (
              <div className="py-12 text-center text-gray-400">
                <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
              </div>
            ) : revenueAnalyticsData.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <DollarSign className="size-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No revenue data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={formatRevenueForChart(revenueAnalyticsData)}>
                  <XAxis
                    dataKey="period"
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
                    formatter={(val) => [
                      `$${Number(val).toLocaleString()}`,
                      "",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                  <Line
                    type="monotone"
                    dataKey="EVENT"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Events"
                  />
                  <Line
                    type="monotone"
                    dataKey="PROGRAM"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Programs"
                  />
                  <Line
                    type="monotone"
                    dataKey="CONSULTATION"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Consultations"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Events & Programs — Registrations & Applications ── */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-6 text-purple-600" />
            Events & Programs — Registrations & Applications
          </CardTitle>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{totalEventApplications} event applications</span>
            <span>{totalProgramApplications} program applications</span>
          </div>
        </CardHeader>
        <CardContent>
          {eventProgramLoading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
            </div>
          ) : !eventProgramData ||
            (eventProgramData.eventRegistrations.length === 0 &&
              eventProgramData.eventApplications.length === 0 &&
              eventProgramData.programApplications.length === 0) ? (
            <div className="py-12 text-center text-gray-400">
              <Calendar className="size-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No events or programs data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatEventsProgramsForChart(eventProgramData)}>
                <XAxis
                  dataKey="period"
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
                <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#a855f7"
                  strokeWidth={2}
                  name="Event Registrations"
                />
                <Line
                  type="monotone"
                  dataKey="Event PENDING"
                  stroke="#eab308"
                  strokeWidth={2}
                  name="Event Applications Pending"
                />
                <Line
                  type="monotone"
                  dataKey="Event ACCEPTED"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Event Applications Accepted"
                />
                <Line
                  type="monotone"
                  dataKey="Program PENDING"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Program Applications Pending"
                />
                <Line
                  type="monotone"
                  dataKey="Program ACCEPTED"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Program Applications Accepted"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Fill Rate vs Capacity ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-6 text-purple-600" />
              Event Fill Rate vs Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventProgramLoading ? (
              <div className="py-8 text-center text-gray-400">
                <Loader2 className="size-5 mx-auto animate-spin" />
              </div>
            ) : !eventProgramData ||
              eventProgramData.eventFillRates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No event capacity data yet
              </p>
            ) : (
              <div className="space-y-3">
                {eventProgramData.eventFillRates.map((event) => (
                  <div key={event.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">
                        {event.title}
                      </span>
                      <span className="text-gray-500">
                        {event.registrations} / {event.capacity}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${Math.min(event.fillRate, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.fillRate}% filled
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="size-6 text-primary" />
              Program Fill Rate vs Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventProgramLoading ? (
              <div className="py-8 text-center text-gray-400">
                <Loader2 className="size-5 mx-auto animate-spin" />
              </div>
            ) : !eventProgramData ||
              eventProgramData.programFillRates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No program capacity data yet
              </p>
            ) : (
              <div className="space-y-3">
                {eventProgramData.programFillRates.map((program) => (
                  <div key={program.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">
                        {program.title}
                      </span>
                      <span className="text-gray-500">
                        {program.participants} / {program.capacity}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(program.fillRate, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {program.fillRate}% filled · {program.applications}{" "}
                      applications
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
