import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { DdRequestModal } from "./Ddrequestmodal ";
import { Skeleton } from "../components/ui/skeleton";
import { useParams, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Users,
  Calendar,
  Briefcase,
  MapPin,
  Sparkles,
  Target,
  Eye,
  FileText,
  Megaphone,
  ImageIcon,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../services/axios";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { InterestButton } from "./Bookmarkfeature";
import AIAssessmentSection from "../components/ui/Aiassessmentsection";
import ProjectAnalyticsDashboard from "../pages/ProjectAnalyticsDashboard";

interface TeamMember {
  name: string;
  role: string;
  photo?: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate?: string;
  completedAt?: string;
  order: number;
  createdAt: string;
}

interface DocumentFile {
  id: string;
  name: string;
  fileUrl: string;
  fileKey: string;
  fileType: string;
  createdAt: string;
}

interface ProjectUpdateItem {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  ownerId: string;
  title: string;
  tagline: string;
  shortDesc: string;
  fullDesc: string;
  industry: string;
  location?: string;
  stage: keyof typeof stageColors;
  status: keyof typeof statusColors;
  featured: boolean;
  fundingSought?: number;
  currency: string;
  viewCount: number;
  visibility: string;
  createdAt: string;
  technologies: string[];
  teamMembers: TeamMember[];
  milestones: Milestone[];
  documents: DocumentFile[];
  owner?: { name: string; email: string };
}

const stageColors = {
  IDEA: "bg-gray-100 text-gray-700",
  PROTOTYPE: "bg-blue-100 text-blue-700",
  MVP: "bg-indigo-100 text-indigo-700",
  GROWTH: "bg-purple-100 text-purple-700",
  SCALING: "bg-green-100 text-green-700",
};

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [updates, setUpdates] = useState<ProjectUpdateItem[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [ddModalOpen, setDdModalOpen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  
  //const location = useLocation();
  const [searchParams] = useSearchParams();
useEffect(() => {
  const fetchProject = async () => {
    try {
      // Read source from URL query 
      const source = searchParams.get("source") ?? "direct";

      const res = await api.get(`/projects/${id}?source=${source}`);
      setProject({
        ...res.data,
        fundingSought:
          res.data.fundingSought != null ? Number(res.data.fundingSought) : 0,
      });
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };
  if (id) fetchProject();
}, [id, searchParams]);

  useEffect(() => {
    if (!id) return;
    const fetchUpdates = async () => {
      try {
        setUpdatesLoading(true);
        const { data } = await api.get(`/projects/${id}/updates`);
        setUpdates(data);
      } catch {
        //  optional
      } finally {
        setUpdatesLoading(false);
      }
    };
    fetchUpdates();
  }, [id]);

  const handlePostUpdate = async () => {
    if (!postContent.trim()) return;
    try {
      setPosting(true);
      const { data } = await api.post(`/projects/${id}/updates`, {
        content: postContent.trim(),
        imageUrl: postImageUrl.trim() || undefined,
      });
      setUpdates((prev) => [data, ...prev]);
      setPostContent("");
      setPostImageUrl("");
      setShowPostForm(false);
      showToast({ type: "success", title: "Update posted!", message: "" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to post update";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setPosting(false);
    }
  };

  const handleBack = () => window.history.back();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 pt-6">
          <Skeleton className="h-8 w-40 mb-4" />
        </div>
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-4 flex-wrap">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-40" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return <div className="p-6">Project not found</div>;

  const isOwner = String(user?.id) === project.ownerId;
  const isAdmin = user?.role === "ADMIN";
  const canInteract = user && !isOwner && !isAdmin;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button */}
      <div className="mb-0">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={handleBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge
                className={`${stageColors[project.stage]} px-4 py-2 text-sm flex items-center gap-2`}
              >
                <Sparkles className="size-4" />
                {project.stage}
              </Badge>
              <Badge
                className={`${statusColors[project.status]} px-4 py-2 text-sm`}
              >
                {project.status}
              </Badge>
              {project.featured && (
                <Badge className="bg-amber-100 text-amber-700 px-4 py-2 text-sm flex items-center gap-2">
                  <Sparkles className="size-4" />
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="text-3xl mb-4 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
              {project.title}
            </h1>
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              {project.tagline}
            </p>

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Briefcase className="size-4 text-indigo-600" />
                </div>
                <span>{project.industry}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="size-4 text-purple-600" />
                </div>
                <span>{project.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="size-4 text-green-600" />
                </div>
                <span>
                  Seeking{" "}
                  {formatCurrency(project.fundingSought ?? 0, project.currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="size-4 text-blue-600" />
                </div>
                <span>By {project.owner?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Eye className="size-4 text-gray-600" />
                </div>
                <span>{project.viewCount.toLocaleString()} views</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
              {project.technologies?.map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="bg-white border-indigo-200 text-indigo-700 px-4 py-1.5"
                >
                  {tech}
                </Badge>
              ))}
            </div>

            {canInteract && (
              <div className="flex items-center gap-2">
                <InterestButton
                  projectId={project.id}
                  projectTitle={project.title}
                  ownerId={project.ownerId}
                />
                <span className="text-sm text-gray-600">Express Interest</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content*/}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
          
{/* About */}
<Card>
  <CardHeader>
    <CardTitle>About This Project</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <p className="text-gray-600 mb-4">{project.shortDesc}</p>
    
    <div
      className={`text-gray-600 leading-relaxed break-words overflow-hidden transition-all duration-300 ${
        showFullDesc ? "" : "max-h-32 relative"
      }`}
    >
      <div dangerouslySetInnerHTML={{ __html: project.fullDesc }} />
      
      {/* Fade overlay when collapsed */}
      {!showFullDesc && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
    </div>

    <button
      onClick={() => setShowFullDesc((v) => !v)}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
    >
      {showFullDesc ? (
        <>
          Show less
          <svg className="size-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </>
      ) : (
        <>
          View more
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </>
      )}
    </button>
  </CardContent>
</Card>
                        {/* Team */}
            <Card>
             
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.teamMembers?.map((member) => (
                    <div key={member.name} className="flex items-center gap-3">
                      <Avatar className="size-14">
                        <AvatarImage
                          src={member.photo || ""}
                          alt={member.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
               {user?.id === project.ownerId && (
               <ProjectAnalyticsDashboard projectId={project.id} />
                 )}

          </div>


          {/* Right Column */}
          <div className="space-y-6">
            {/* Funding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-5" />
                  Funding Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Target Amount</p>
                  <p className="text-3xl font-semibold text-indigo-600">
                    {formatCurrency(
                      project.fundingSought ?? 0,
                      project.currency,
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.documents?.map((doc, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      window.open(
                        `${import.meta.env.VITE_API_URL}/uploads/document/download?url=${encodeURIComponent(doc.fileUrl)}&originalName=${encodeURIComponent(doc.name)}`,
                      );
                    }}
                  >
                    <FileText className="size-4" />
                    <span className="flex-1 text-left">{doc.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {doc.fileType}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="font-medium">{formatDate(project.createdAt)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Visibility</p>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {project.visibility}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Views</p>
                  <p className="font-medium">
                    {project.viewCount.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>




            {/* Roadmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  Roadmap & Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {project.milestones?.map((milestone, index) => (
                      <div key={index} className="relative flex gap-4">
                        <div
                          className={`relative z-10 size-12 rounded-full flex items-center justify-center flex-shrink-0 ${milestone.completedAt ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          <Calendar className="size-5" />
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {milestone.title}
                            </h4>
                            {milestone.completedAt && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            Target:{" "}
                            {milestone.targetDate
                              ? formatDate(milestone.targetDate)
                              : "No date"}
                            {milestone.completedAt &&
                              ` • Completed: ${formatDate(milestone.completedAt)}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
                        {/* PROJECT UPDATES CARD */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="size-5 text-indigo-500" />
                    Updates
                    {updates.length > 0 && (
                      <Badge className="bg-indigo-100 text-indigo-700 text-xs ml-1">
                        {updates.length}
                      </Badge>
                    )}
                  </CardTitle>

                  {/* Post button */}
                  {isOwner && project.status === "APPROVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-8"
                      onClick={() => setShowPostForm((v) => !v)}
                    >
                      {showPostForm ? (
                        <>
                          <X className="size-3.5" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5" />
                          Post
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Post form — owner only */}
                
                {isOwner && showPostForm && (
                  <div className="bg-indigo-50 rounded-xl p-4 space-y-3 border border-indigo-100">
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Share a project update with the community..."
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {postContent.length}/1000
                    </p>

                    {/* Optional image URL */}
                    <div className="flex items-center gap-2">
                      <ImageIcon className="size-4 text-gray-400 flex-shrink-0" />
                      <input
                        type="url"
                        value={postImageUrl}
                        onChange={(e) => setPostImageUrl(e.target.value)}
                        placeholder="Image URL (optional)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
                      />
                    </div>

                    {/* Image preview */}
                    {postImageUrl && (
                      <div className="rounded-lg overflow-hidden h-28 bg-gray-100">
                        <img
                          src={postImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            ((e.target as HTMLImageElement).style.display =
                              "none")
                          }
                        />
                      </div>
                    )}

                    <Button
                      onClick={handlePostUpdate}
                      disabled={posting || !postContent.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-9"
                    >
                      {posting ? "Posting..." : "Post Update"}
                    </Button>
                  </div>
                )}

                {/* Updates list */}
                {updatesLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="space-y-2 animate-pulse">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : updates.length === 0 ? (
                  <div className="text-center py-6">
                    <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No updates yet</p>
                    {isOwner && project.status === "APPROVED" && (
                      <p className="text-xs text-gray-400 mt-1">
                        Post your first update to keep the community informed
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updates.map((update, idx) => (
                      <div key={update.id}>
                        {/* Update item */}
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {update.content}
                          </p>

                          {/* Image */}
                          {update.imageUrl && (
                            <div className="rounded-lg overflow-hidden h-36 bg-gray-100">
                              <img
                                src={update.imageUrl}
                                alt="Update"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="size-3" />
                            <span>{timeAgo(update.createdAt)}</span>
                          </div>
                        </div>

                        {/* Divider between updates */}
                        {idx < updates.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* END PROJECT UPDATES CARD */}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-10">
        
        <AIAssessmentSection
          projectId={id!}
          projectStatus={project.status}
          isAdmin={isAdmin}
        />
      </div>
      {user?.role === "INVESTOR" && project.status === "APPROVED" && (
  <>
    <Button onClick={() => setDdModalOpen(true)}>Request Due Diligence</Button>
    <DdRequestModal open={ddModalOpen} onOpenChange={setDdModalOpen} projectId={project.id} projectTitle={project.title} />
  </>
)}
    </div>
  );
}
