import {
  Plus,
  TrendingUp,
  Eye,
  Clock,
  Users,
  Calendar,
  ArrowRight,
  Pencil, 
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import api from "../../services/axios";
import { ProjectCreationWizard } from "./ProjectCreationWizard";
import { AppModal } from "../components/ui/modal";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
/* =========================
   TYPES
========================= */

interface TeamMember {
  id: string;
}

interface Project {
  id: string;
  title: string;
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

/* =========================
   HELPERS
========================= */

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

/* =========================
   COMPONENT
========================= */

export default function StartupDashboard() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
const confirmDelete = async () => {
  if (!deleteProjectId) return;

  try {
    await api.delete(`/projects/${deleteProjectId}`);
    setProjects((prev) =>
      prev.filter((p) => p.id !== deleteProjectId)
    );
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
}
};
const handleEdit = (id: string) => {
  setEditingProjectId(id);
  setIsWizardOpen(true);
};
  
  const fetchDashboard = async () => {
  try {
    setLoading(true); 
    const res = await api.get("/projects/dashboard", {
    params: { q: search },
  });
    setStats(res.data.stats);
    setProjects(res.data.projects);
  } catch (error) {
    console.error("Dashboard error:", error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDashboard();
}, [search]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-10">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Startup Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your projects and track performance
          </p>
        </div>
         <ProjectCreationWizard
  isOpen={isWizardOpen}
  onClose={() => {
    setIsWizardOpen(false);
    setEditingProjectId(null);
  }}
  projectId={editingProjectId}
  onProjectSaved={fetchDashboard}
/>
        <Button onClick={() => setIsWizardOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-fit">
          <Plus className="size-5 mr-2" />
          Create Project
        </Button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 ">
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

        
      </div>

      {/* ================= PROJECTS ================= */}
      <div>
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <h2 className="text-2xl font-semibold text-gray-900">
      My Projects
    </h2>

    <Input
      type="text"
      placeholder="Search my projects..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full sm:w-64"
    />
  </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start by creating your first startup project.
            </p>
            <Button>Create Project</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
  <div className="flex items-center gap-2">
  <CardTitle className="text-xl text-gray-900">
    {project.title}
  </CardTitle>

  <Badge
    className={`px-2 py-0.5 text-xs ${getStatusColor(project.status)}`}
  >
    {project.status}
  </Badge>
</div>

  <div className="flex gap-2">
    {project.status === "DRAFT" && (
  <Button
    size="icon"
    variant="ghost"
    onClick={() => handleEdit(project.id)}
  >
    <Pencil className="w-4 h-4 text-blue-600" />
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
                  <div className="flex flex-wrap gap-2">
                    {project.technologies?.map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2 pb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="size-4" />
                    <span className="font-medium">Stage:</span>
                    <span>{project.stage}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="size-4" />
                    <span className="font-medium">Views:</span>
                    <span>{project.viewCount}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="size-4" />
                    <span className="font-medium">Team:</span>
                    <span>
                      {project.teamMembers.length} members
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="size-4" />
                    <span className="font-medium">Created:</span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate(`/app/startup/projects/${project.id}`)}
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
  <p className="text-sm text-gray-600">
    This action cannot be undone.
  </p>
</AppModal>
    </div>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({ title, value, icon }: StatCardProps) {
  return (
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {value}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-gray-100">
            {icon}
          </div>
        </div>

        
      </CardContent>
    </Card>
  );
}