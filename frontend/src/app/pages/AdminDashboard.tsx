import { useEffect, useState } from "react";
import {
  Users,
  //FolderOpen,
  Clock,
  Check,
  X,
  Loader2,
  Calendar,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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

type Project = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  profile?: {
    expertise?: string[];
    expertApplicationStatus?: string;
  };
};

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendLoading, setSuspendLoading] = useState<string | null>(null);
  const [expertApplicants, setExpertApplicants] = useState<User[]>([]);

  const fetchPendingProjects = async () => {
    try {
      const { data } = await api.get("/admin/projects/pending");
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchExpertApplicants = async () => {
    try {
      const { data } = await api.get("/admin/users");
      const pending = data.filter(
        (u: User) => u.profile?.expertApplicationStatus === "PENDING",
      );
      setExpertApplicants(pending);
    } catch (error) {
      console.error("Error fetching expert applicants:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPendingProjects(),
        fetchUsers(),
        fetchExpertApplicants(),
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleApprove = async (projectId: string) => {
    try {
      setActionLoading(projectId);
      await api.patch(`/admin/projects/${projectId}/approve`);
      await fetchPendingProjects();
    } catch (error) {
      console.error("Approve failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (projectId: string) => {
    try {
      setActionLoading(projectId);
      await api.patch(`/admin/projects/${projectId}/reject`);
      await fetchPendingProjects();
    } catch (error) {
      console.error("Reject failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("Role update failed:", error);
    }
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
    } catch (error) {
      console.error("Suspend toggle failed:", error);
    } finally {
      setSuspendLoading(null);
    }
  };

  const handleApproveExpert = async (userId: string) => {
    try {
      await api.patch(`/admin/experts/${userId}/approve`);
      setExpertApplicants((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Approve expert failed:", error);
    }
  };

  const handleRejectExpert = async (userId: string) => {
    try {
      await api.patch(`/admin/experts/${userId}/reject`);
      setExpertApplicants((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Reject expert failed:", error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "STARTUP":  return "bg-blue-100 text-blue-700";
      case "MEMBER":   return "bg-purple-100 text-purple-700";
      case "EXPERT":   return "bg-green-100 text-green-700";
      case "ADMIN":    return "bg-red-100 text-red-700";
      case "INVESTOR": return "bg-yellow-100 text-yellow-700";
      default:         return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/*  HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage users, projects, and approvals</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-semibold">{users.length}</p>
            </div>
            <Users className="size-7 text-blue-600" />
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pending Projects</p>
              <p className="text-3xl font-semibold">{projects.length}</p>
            </div>
            <Clock className="size-7 text-orange-500" />
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Suspended Users</p>
              <p className="text-3xl font-semibold">
                {users.filter((u) => u.isSuspended).length}
              </p>
            </div>
            <ShieldOff className="size-7 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* PENDING PROJECTS */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Pending Project Approvals</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                    No pending projects
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell
                      className="cursor-pointer hover:bg-gray-50 font-medium"
                      onClick={() => navigate(`/app/startup/projects/${project.id}`)}
                    >
                      {project.title}
                    </TableCell>
                    <TableCell>{project.owner?.name}</TableCell>
                    <TableCell>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === project.id}
                          onClick={(e) => { e.stopPropagation(); handleApprove(project.id); }}
                          className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
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
                          onClick={(e) => { e.stopPropagation(); handleReject(project.id); }}
                          className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
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

      {/* USER MANAGEMENT */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Change Role</TableHead>
                <TableHead className="text-right">Suspend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.isSuspended ? "bg-red-50 opacity-80" : ""}
                >
                  <TableCell
                    className="cursor-pointer hover:bg-gray-50 font-medium"
                    onClick={() => navigate(`/app/profile/${user.id}`)}
                  >
                    {user.name}
                  </TableCell>

                  <TableCell className="text-gray-600">{user.email}</TableCell>

                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>

                  {/* Account status badge */}
                  <TableCell>
                    {user.isSuspended ? (
                      <Badge className="bg-red-100 text-red-700 border border-red-200">
                        Suspended
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border border-green-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>

                  {/* Role change */}
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={user.isSuspended}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger
                        className="w-full sm:w-[150px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="STARTUP">Startup</SelectItem>
                        <SelectItem value="EXPERT">Expert</SelectItem>
                        <SelectItem value="INVESTOR">Investor</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Suspend / Reactivate button */}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={suspendLoading === user.id}
                      onClick={() => handleToggleSuspend(user)}
                      className={
                        user.isSuspended
                          ? "border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
                          : "border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500"
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

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => navigate("/app/events/create")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Calendar className="size-4 mr-2" />
          Create Event
        </Button>
        <Button variant="outline" onClick={() => navigate("/app/events/my")}>
          <Calendar className="size-4 mr-2" />
          My Events
        </Button>
      </div>

      {/* EXPERT APPLICATIONS */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Pending Expert Applications</h2>
        </div>
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
                  <TableCell colSpan={4} className="text-center py-6 text-gray-400">
                    No pending expert applications
                  </TableCell>
                </TableRow>
              ) : (
                expertApplicants.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {(u.profile?.expertise ?? []).join(", ") || "—"}
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

    </div>
  );
}