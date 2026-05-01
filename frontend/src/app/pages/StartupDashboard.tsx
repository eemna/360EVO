import {
  Plus,
  TrendingUp,
  Eye,
  Clock,
  Users,
  Calendar,
  ArrowRight,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import api from "../../services/axios";
import { ProjectCreationWizard } from "./ProjectCreationWizard";
import { AppModal } from "../components/ui/modal";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { FolderOpen, Bell } from "lucide-react";

interface TeamMember {
  id: string;
}

interface Project {
  id: string;
  title: string;
  shortDesc?: string;
  tagline?: string;
  status: string;
  stage: string;
  industry: string;
  technologies: string[];
  fundingSought: number;
  viewCount: number;
  createdAt: string;
  teamMembers: TeamMember[];
}

interface Stats {
  totalProjects: number;
  totalViews: number;
  pending: number;
  approved: number;
  draft: number;
}

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "DRAFT":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
};

export default function StartupDashboard() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [pendingDdCount, setPendingDdCount] = useState(0);
  const [editingProjectStatus, setEditingProjectStatus] = useState<
    string | null
  >(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const q = search.toLowerCase().trim();
  const projects = allProjects.filter((p) => {
    const matchesSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.shortDesc?.toLowerCase().includes(q) ||
      p.tagline?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const confirmDelete = async () => {
    if (!deleteProjectId) return;

    try {
      setDeleting(true);
      await api.delete(`/projects/${deleteProjectId}`);
      setAllProjects((prev) => prev.filter((p) => p.id !== deleteProjectId));
      showToast({
        type: "success",
        title: "Project deleted",
        message: "The project was removed successfully.",
      });

      setDeleteProjectId(null);
    } catch (error: unknown) {
      let message = "Delete failed";

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }

      showToast({
        type: "error",
        title: "Delete failed",
        message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (id: string, status: string) => {
    setEditingProjectId(id);
    setEditingProjectStatus(status);
    setWizardLoading(true);
    setIsWizardOpen(true);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, ddRes] = await Promise.all([
        api.get("/projects/dashboard"),
        api.get("/dd-requests/received").catch(() => ({ data: [] })),
      ]);
      setStats(dashRes.data.stats);
      setAllProjects(dashRes.data.projects);

      const pending = ddRes.data.filter(
        (r: { status: string }) => r.status === "PENDING",
      ).length;
      setPendingDdCount(pending);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-10 p-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Stats skeleton — 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-20" />
            </Card>
          ))}
        </div>

        {/* Projects skeleton — 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Startup Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects and track performance
          </p>
        </div>

        <ProjectCreationWizard
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setEditingProjectId(null);
            setEditingProjectStatus(null);
          }}
          projectId={editingProjectId}
          projectStatus={editingProjectStatus}
          loading={wizardLoading}
          setLoading={setWizardLoading}
          onProjectSaved={fetchDashboard}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/app/events/my")}
            className="gap-2"
          >
            <Calendar className="size-4" />
            My Events
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/app/startup/dd-requests")}
            className="gap-2"
          >
            <FolderOpen className="size-4" />
            Data Room Requests
            {pendingDdCount > 0 && (
              <span className="ml-1 bg-green-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingDdCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/app/programs/my-applications")}
            className="gap-2"
          >
            <BookOpen className="size-4" />
            My Applications
          </Button>
          <Button
            onClick={() => setIsWizardOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="size-5" />
            Create Project
          </Button>
        </div>
      </div>

      {/* STATS — all 4 in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<TrendingUp className="size-6 text-blue-600" />}
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={<Eye className="size-6 text-purple-600" />}
        />
        <StatCard
          title="Pending Requests"
          value={stats.pending}
          icon={<Clock className="size-6 text-yellow-600" />}
        />
        <Card
          className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer"
          onClick={() => navigate("/app/startup/dd-requests")}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">DD Requests</p>
                <p className="text-2xl font-semibold text-green-600">
                  {pendingDdCount}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">pending</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <FolderOpen className="size-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DD INBOX BANNER */}
      {pendingDdCount > 0 && (
        <div
          className="flex items-center justify-between gap-4 p-4 bg-green-50 border border-green-200 rounded-xl cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => navigate("/app/startup/dd-requests")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell className="size-4 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">
                {pendingDdCount} Investor{pendingDdCount > 1 ? "s" : ""} Want
                Access to Your Data Room
              </p>
              <p className="text-xs text-green-700">
                Review and grant or decline access to your project documents
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 gap-2 flex-shrink-0"
          >
            <FolderOpen className="size-4" />
            Review & Grant Access
          </Button>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl font-semibold text-foreground">
              My Projects
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                ["ALL", "DRAFT", "PENDING", "APPROVED", "REJECTED"] as const
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    statusFilter === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  <span className="ml-1 opacity-70">
                    (
                    {s === "ALL"
                      ? allProjects.length
                      : allProjects.filter((p) => p.status === s).length}
                    )
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Input
            type="text"
            placeholder="Search my projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-16 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">
              {search ? "No projects match your search" : "No projects yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {search
                ? "Try a different search term."
                : "Start by creating your first startup project."}
            </p>
            {!search && (
              <Button
                onClick={() => setIsWizardOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 w-fit"
              >
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg text-gray-900">
                        {project.title}
                      </CardTitle>
                      <Badge
                        className={`px-2 py-0.5 text-xs ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </Badge>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {(project.status === "DRAFT" ||
                        project.status === "APPROVED") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(project.id, project.status)}
                          title={
                            project.status === "APPROVED"
                              ? "Edit team & milestones only"
                              : "Edit project"
                          }
                        >
                          <Pencil
                            className={`w-4 h-4 ${project.status === "APPROVED" ? "text-gray-400" : "text-blue-600"}`}
                          />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => {
                          if (project.status !== "DRAFT") {
                            showToast({
                              type: "warning",
                              title: "Action not allowed",
                              message: "Only draft projects can be deleted.",
                            });
                            return;
                          }
                          setDeleteProjectId(project.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags from technologies */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies?.map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 pt-2 pb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="size-4 flex-shrink-0" />
                    <span className="font-medium">Stage:</span>
                    <span>{project.stage}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="size-4 flex-shrink-0" />
                    <span className="font-medium">Views:</span>
                    <span>{project.viewCount}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4 flex-shrink-0" />
                    <span className="font-medium">Team:</span>
                    <span>{project.teamMembers.length} members</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4 flex-shrink-0" />
                    <span className="font-medium">Created:</span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() =>
                      navigate(`/app/startup/projects/${project.id}`)
                    }
                  >
                    View Details
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AppModal
        open={!!deleteProjectId}
        onOpenChange={() => setDeleteProjectId(null)}
        title="Delete Project"
        description="Are you sure you want to delete this project?"
        submitText="Delete"
        cancelText="Cancel"
        onSubmit={confirmDelete}
      >
        <p className="text-sm text-gray-600">This action cannot be undone.</p>
        {deleting && (
          <div className="flex justify-center mt-4">
            <LoadingSpinner size="md" />
          </div>
        )}
      </AppModal>
    </div>
  );
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-100">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
