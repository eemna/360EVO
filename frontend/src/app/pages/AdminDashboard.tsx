import { useEffect, useState, useCallback } from "react";
import {
  Users, Clock, Check, X, Loader2, Calendar,
  ShieldOff, ShieldCheck, BarChart3, TrendingUp,
  BookOpen, Search, DollarSign, FolderOpen,CheckCircle2
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../../services/axios";


type Stats = {
  users: number;
  projects: number;
  events: number;
  programs: number;
  totalRevenue: number;
};

type Project = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  owner: { name: string; email: string };
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  profile?: { expertise?: string[]; expertApplicationStatus?: string };
};

type Program = {
  id: string;
  title: string;
  type: string;
  status: string;
  applicationDeadline: string;
  organizer: { name: string };
  _count: { applications: number; participants: number };
};

type RevenueRow = {
  month: string;
  total: number;
  count: number;
  referenceType: string;
};
type AdminEvent = {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  location: string | null;
  organizer: { name: string };
  _count: { registrations: number };
};

const ROLE_COLORS: Record<string, string> = {
  STARTUP: "bg-blue-100 text-blue-700",
  MEMBER: "bg-purple-100 text-purple-700",
  EXPERT: "bg-green-100 text-green-700",
  ADMIN: "bg-red-100 text-red-700",
  INVESTOR: "bg-yellow-100 text-yellow-700",
};

const PROGRAM_TYPE_COLORS: Record<string, string> = {
  INCUBATION: "bg-blue-100 text-blue-700",
  ACCELERATION: "bg-orange-100 text-orange-700",
  MENTORSHIP: "bg-green-100 text-green-700",
};


type ActiveSection = "overview" | "users" | "projects" | "programs" | "experts" | "revenue" | "events";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");

  
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
const [revenueData, setRevenueData] = useState<RevenueRow[]>([]);
const [rawRevenueData, setRawRevenueData] = useState<RevenueRow[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendLoading, setSuspendLoading] = useState<string | null>(null);
  const [expertApplicants, setExpertApplicants] = useState<User[]>([]);

  const [events, setEvents] = useState<AdminEvent[]>([]);


  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");


  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
const [statsRes, projectsRes, usersRes, programsRes, eventsRes] = await Promise.allSettled([
  api.get("/admin/stats"),
  api.get("/admin/projects/pending"),
  api.get("/admin/users"),
  api.get("/admin/programs").catch(() => ({ data: [] })),
  api.get("/admin/events").catch(() => ({ data: [] })),
]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (projectsRes.status === "fulfilled") setProjects(projectsRes.value.data);
      if (usersRes.status === "fulfilled") {
        const allUsers: User[] = usersRes.value.data;
        setUsers(allUsers);
        setExpertApplicants(
          allUsers.filter((u) => u.profile?.expertApplicationStatus === "PENDING"),
        );
      }
      if (programsRes.status === "fulfilled") setPrograms(programsRes.value.data);
      if (eventsRes.status === "fulfilled") setEvents(eventsRes.value.data);

    } finally {
      setLoading(false);
    }
  }, []);

  
const fetchRevenue = useCallback(async () => {
  try {
    const { data } = await api.get("/admin/reports/revenue");

    const raw = data.map((row: RevenueRow) => ({
      ...row,
      month: new Date(row.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      total: Number(row.total),
      count: Number(row.count),
    }));
    setRawRevenueData(raw);

    const merged = raw.reduce((acc: RevenueRow[], row: RevenueRow) => {
      const existing = acc.find((r) => r.month === row.month);
      if (existing) {
        existing.total += row.total;
        existing.count += row.count;
      } else {
        acc.push({ ...row });
      }
      return acc;
    }, []);
    setRevenueData(merged);

  } catch {
    setRevenueData([]);
    setRawRevenueData([]);
  }
}, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (activeSection === "revenue") fetchRevenue();
  }, [activeSection, fetchRevenue]);


  const handleApprove = async (projectId: string) => {
    try {
      setActionLoading(projectId);
      await api.patch(`/admin/projects/${projectId}/approve`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (stats) setStats({ ...stats, projects: stats.projects });
    } catch { /* toast handled globally */ }
    finally { setActionLoading(null); }
  };

  const handleReject = async (projectId: string) => {
    try {
      setActionLoading(projectId);
      await api.patch(`/admin/projects/${projectId}/reject`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch { /* */ }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  };

  const handleToggleSuspend = async (user: User) => {
    try {
      setSuspendLoading(user.id);
      const endpoint = user.isSuspended
        ? `/admin/users/${user.id}/unsuspend`
        : `/admin/users/${user.id}/suspend`;
      await api.patch(endpoint);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u)),
      );
    } finally { setSuspendLoading(null); }
  };

  const handleApproveExpert = async (userId: string) => {
    await api.patch(`/admin/experts/${userId}/approve`);
    setExpertApplicants((prev) => prev.filter((u) => u.id !== userId));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, role: "EXPERT", profile: { ...u.profile, expertApplicationStatus: "APPROVED" } }
          : u,
      ),
    );
  };

  const handleRejectExpert = async (userId: string) => {
    await api.patch(`/admin/experts/${userId}/reject`);
    setExpertApplicants((prev) => prev.filter((u) => u.id !== userId));
  };


  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });


  const NAV_ITEMS: { key: ActiveSection; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "projects", label: "Projects", icon: FolderOpen, badge: projects.length || undefined },
    { key: "users", label: "Users", icon: Users },
    { key: "experts", label: "Experts", icon: TrendingUp, badge: expertApplicants.length || undefined },
    { key: "programs", label: "Programs", icon: BookOpen },
    { key: "revenue", label: "Revenue", icon: DollarSign },
    { key: "events", label: "Events", icon: Calendar },
  ];


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the 360EVO platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/app/events/create")}
            className="bg-blue-600 hover:bg-blue-700 gap-1.5"
          >
            <Calendar className="size-4" />
            Create Event
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/app/programs/create")}
            className="gap-1.5"
          >
            <BookOpen className="size-4" />
            Create Program
          </Button>
        </div>
      </div>

      {/* Section Nav */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {NAV_ITEMS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === key
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeSection === key ? "bg-white/20" : "bg-red-100 text-red-600"
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─── */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Users", value: stats?.users ?? 0, icon: Users, accent: "text-blue-600", bg: "bg-blue-50" },
              { label: "Total Projects", value: stats?.projects ?? 0, icon: FolderOpen, accent: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Events", value: stats?.events ?? 0, icon: Calendar, accent: "text-purple-600", bg: "bg-purple-50" },
              { label: "Programs", value: stats?.programs ?? 0, icon: BookOpen, accent: "text-green-600", bg: "bg-green-50" },
              {
                label: "Total Revenue",
                value: `$${Number(stats?.totalRevenue ?? 0).toLocaleString()}`,
                icon: DollarSign,
                accent: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map(({ label, value, icon: Icon, accent, bg }) => (
              <Card key={label} className="border border-gray-200">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${bg}`}>
                      <Icon className={`size-4 ${accent}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveSection("projects")}
              className="text-left p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <p className="text-2xl font-bold text-amber-700">{projects.length}</p>
              <p className="text-sm text-amber-600 font-medium">Pending Projects</p>
              <p className="text-xs text-amber-500 mt-0.5">Click to review →</p>
            </button>
            <button
              onClick={() => setActiveSection("experts")}
              className="text-left p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <p className="text-2xl font-bold text-blue-700">{expertApplicants.length}</p>
              <p className="text-sm text-blue-600 font-medium">Expert Applications</p>
              <p className="text-xs text-blue-500 mt-0.5">Click to review →</p>
            </button>
            <button
              onClick={() => setActiveSection("users")}
              className="text-left p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
            >
              <p className="text-2xl font-bold text-red-700">
                {users.filter((u) => u.isSuspended).length}
              </p>
              <p className="text-sm text-red-600 font-medium">Suspended Users</p>
              <p className="text-xs text-red-500 mt-0.5">Click to manage →</p>
            </button>
          </div>
        </div>
      )}

      {/* ── PENDING PROJECTS ─ */}
      {activeSection === "projects" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-amber-500" />
              Pending Project Approvals
              {projects.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700">{projects.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      <CheckCircle2 className="size-6 mx-auto mb-2 text-green-400" />
                      All caught up! No pending projects.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell
                        className="font-medium cursor-pointer hover:text-indigo-600"
                        onClick={() => navigate(`/app/startup/projects/${project.id}`)}
                      >
                        {project.title}
                      </TableCell>
                      <TableCell className="text-gray-600">{project.owner?.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === project.id}
                            onClick={() => handleApprove(project.id)}
                            className="border-green-500 text-green-600 hover:bg-green-50"
                          >
                            {actionLoading === project.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <><Check className="size-4 mr-1" />Approve</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === project.id}
                            onClick={() => handleReject(project.id)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            <X className="size-4 mr-1" />Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── USERS ─ */}
      {activeSection === "users" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="STARTUP">Startup</SelectItem>
                <SelectItem value="EXPERT">Expert</SelectItem>
                <SelectItem value="INVESTOR">Investor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4" />
                Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className={user.isSuspended ? "bg-red-50 opacity-80" : ""}
                    >
                      <TableCell
                        className="font-medium cursor-pointer hover:text-indigo-600"
                        onClick={() => navigate(`/app/profile/${user.id}`)}
                      >
                        {user.name}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[user.role]}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.isSuspended
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }
                        >
                          {user.isSuspended ? "Suspended" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          disabled={user.isSuspended}
                          onValueChange={(v) => handleRoleChange(user.id, v)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="STARTUP">Startup</SelectItem>
                            <SelectItem value="EXPERT">Expert</SelectItem>
                            <SelectItem value="INVESTOR">Investor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={suspendLoading === user.id}
                          onClick={() => handleToggleSuspend(user)}
                          className={
                            user.isSuspended
                              ? "border-green-500 text-green-600 hover:bg-green-50"
                              : "border-red-400 text-red-600 hover:bg-red-50"
                          }
                        >
                          {suspendLoading === user.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : user.isSuspended ? (
                            <><ShieldCheck className="size-4 mr-1" />Reactivate</>
                          ) : (
                            <><ShieldOff className="size-4 mr-1" />Suspend</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ── EXPERT APPLICATIONS ─ */}
      {activeSection === "experts" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-green-600" />
              Expert Applications
              {expertApplicants.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700">{expertApplicants.length} pending</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expertApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      No pending expert applications
                    </TableCell>
                  </TableRow>
                ) : (
                  expertApplicants.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-gray-500">{u.email}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {u.profile?.expertise?.join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-600 hover:bg-green-50"
                            onClick={() => handleApproveExpert(u.id)}
                          >
                            <Check className="size-4 mr-1" />Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-600 hover:bg-red-50"
                            onClick={() => handleRejectExpert(u.id)}
                          >
                            <X className="size-4 mr-1" />Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── PROGRAMS ── */}
      {activeSection === "programs" && (
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="size-4 text-blue-600" />
              Programs ({programs.length})
            </CardTitle>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => navigate("/app/programs/create")}
            >
              + New Program
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      No programs yet. Create the first one.
                    </TableCell>
                  </TableRow>
                ) : (
                  programs.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/app/programs/${p.id}`)}
                    >
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>
                        <Badge className={PROGRAM_TYPE_COLORS[p.type] || "bg-gray-100 text-gray-700"}>
                          {p.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.status === "OPEN"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{p._count.applications}</TableCell>
                      <TableCell className="font-medium">{p._count.participants}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(p.applicationDeadline).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
{/* ── EVENTS ─ */}
{activeSection === "events" && (
  <Card className="border border-gray-200">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2">
        <Calendar className="size-4 text-purple-600" />
        Events ({events.length})
      </CardTitle>
      <Button
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => navigate("/app/events/create")}
      >
        + New Event
      </Button>
    </CardHeader>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Registrations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                No events yet. Create the first one.
              </TableCell>
            </TableRow>
          ) : (
            events.map((e) => (
              <TableRow
                key={e.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/app/events/${e.id}`)}
              >
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>
                  <Badge className="bg-purple-100 text-purple-700">
                    {e.type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      e.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : e.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(e.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {e.location ?? "Online"}
                </TableCell>
                <TableCell className="font-medium">
                  {e._count.registrations}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </Card>
)}
      {/* ── REVENUE ─ */}
      {activeSection === "revenue" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  ${Number(stats?.totalRevenue ?? 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-gray-500 font-medium">Total Transactions</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">
                  {revenueData.reduce((acc, r) => acc + Number(r.count), 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="size-4 text-green-600" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <DollarSign className="size-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No revenue data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(val) => [`$${Number(val).toLocaleString()}`, "Revenue"]}
                    />
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue table */}
          {revenueData.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Transaction History</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
{rawRevenueData.map((row, i) => (
  <TableRow key={i}>
    <TableCell className="font-medium">{row.month}</TableCell>
    <TableCell>
      <Badge className="bg-gray-100 text-gray-700">{row.referenceType}</Badge>
    </TableCell>
    <TableCell>{row.count}</TableCell>
    <TableCell className="font-semibold text-green-600">
      ${row.total.toLocaleString()}
    </TableCell>
  </TableRow>
))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}