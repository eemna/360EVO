import { useEffect, useState } from "react";
import { Users, FolderOpen, Clock, Check, X, Loader2 } from "lucide-react";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
};

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // =============================
  // Fetch Data
  // =============================
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

  // =============================
  // Approve Project
  // =============================
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

  // =============================
  // Reject Project
  // =============================
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

  // =============================
  // Change Role
  // =============================
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        role: newRole,
      });
      fetchUsers();
    } catch (error) {
      console.error("Role update failed:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingProjects(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "STARTUP":
        return "bg-blue-100 text-blue-700";
      case "MEMBER":
        return "bg-purple-100 text-purple-700";
      case "EXPERT":
        return "bg-green-100 text-green-700";
      case "ADMIN":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Manage users, projects, and approvals
        </p>
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
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-3xl font-semibold">{projects.length}</p>
            </div>
            <FolderOpen className="size-7 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* PENDING PROJECTS */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <div className="p-6 border-b border-gray-400">
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
                <TableCell colSpan={5} className="text-center py-6">
                  No pending projects
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.owner?.name}</TableCell>
                  <TableCell>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {project.status}
                    </Badge>
                  </TableCell>

                  {/* ✅ IMPROVED BUTTONS */}
                  <TableCell className="text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      {/* APPROVE */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === project.id}
                        onClick={() => handleApprove(project.id)}
                        className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
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

                      {/* REJECT */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === project.id}
                        onClick={() => handleReject(project.id)}
                        className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
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
        </Table> </div>
      </Card>

      {/* USER MANAGEMENT */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <div className="p-6 border-b border-gray-400">
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
       <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Change Role</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-full sm:w-[160px] ml-auto">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
}
