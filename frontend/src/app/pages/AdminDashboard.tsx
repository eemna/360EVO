import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Clock,
  Check,
  X,
  Loader2,
  ShieldOff,
  ShieldCheck,
  BarChart3,
  Search,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import api from "../../services/axios";

type Stats = {
  users: number;
  projects: number;
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

const ROLE_COLORS: Record<string, string> = {
  STARTUP: "bg-blue-100 text-blue-700",
  MEMBER: "bg-purple-100 text-purple-700",
  EXPERT: "bg-green-100 text-green-700",
  ADMIN: "bg-red-100 text-red-700",
  INVESTOR: "bg-yellow-100 text-yellow-700",
};

type ActiveSection = "overview" | "users" | "projects";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");

  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendLoading, setSuspendLoading] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, projectsRes, usersRes] = await Promise.allSettled([
        api.get("/admin/stat"),
        api.get("/admin/projects/pending"),
        api.get("/admin/users"),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (projectsRes.status === "fulfilled")
        setProjects(projectsRes.value.data);
      if (usersRes.status === "fulfilled") {
        const allUsers: User[] = usersRes.value.data;
        setUsers(allUsers);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApprove = async (projectId: string) => {
    try {
      setActionLoading(projectId);
      await api.patch(`/admin/projects/${projectId}/approve`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (stats) setStats({ ...stats, projects: stats.projects });
    } catch {
      /* to */
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (projectId: string) => {
    try {
      setActionLoading(projectId);
      await api.patch(`/admin/projects/${projectId}/reject`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch {
      /* */
    } finally {
      setActionLoading(null);
    }
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
        prev.map((u) =>
          u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u,
        ),
      );
    } finally {
      setSuspendLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const NAV_ITEMS: {
    key: ActiveSection;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    {
      key: "projects",
      label: "Projects",
      icon: FolderOpen,
      badge: projects.length || undefined,
    },
    { key: "users", label: "Users", icon: Users },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
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
          <p className="text-gray-500 text-sm mt-1">
            Manage the 360EVO platform
          </p>
        </div>
        {/*
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
 */}
      </div>

      {/* Section Nav */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {NAV_ITEMS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            data-testid={`nav-${key}`}
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
                  activeSection === key
                    ? "bg-white/20"
                    : "bg-red-100 text-red-600"
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
              {
                label: "Total Users",
                value: stats?.users ?? 0,
                icon: Users,
                accent: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Total Projects",
                value: stats?.projects ?? 0,
                icon: FolderOpen,
                accent: "text-indigo-600",
                bg: "bg-indigo-50",
              },
            ].map(({ label, value, icon: Icon, accent, bg }) => (
              <Card key={label} className="border border-gray-200">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        {label}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${accent}`}>
                        {value}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${bg}`}>
                      <Icon className={`size-4 ${accent}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <Badge className="bg-amber-100 text-amber-700">
                  {projects.length}
                </Badge>
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
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-gray-400"
                    >
                      <CheckCircle2 className="size-6 mx-auto mb-2 text-green-400" />
                      All caught up! No pending projects.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell
                        className="font-medium cursor-pointer hover:text-indigo-600"
                        onClick={() =>
                          navigate(`/app/startup/projects/${project.id}`)
                        }
                      >
                        {project.title}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {project.owner?.name}
                      </TableCell>
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
                              <>
                                <Check className="size-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === project.id}
                            onClick={() => handleReject(project.id)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            <X className="size-4 mr-1" />
                            Reject
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
                      <TableCell className="text-gray-500 text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[user.role]}>
                          {user.role}
                        </Badge>
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
                            <>
                              <ShieldCheck className="size-4 mr-1" />
                              Reactivate
                            </>
                          ) : (
                            <>
                              <ShieldOff className="size-4 mr-1" />
                              Suspend
                            </>
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
    </div>
  );
}
