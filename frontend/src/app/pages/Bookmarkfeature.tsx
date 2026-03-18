import { useState, useEffect} from "react";
import { useNavigate, Link } from "react-router";
import { Bookmark, MessageSquarePlus, MapPin, Target, Eye, Users, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import { AppModal } from "../components/ui/modal";
import { useBookmarks } from "../../hooks/useBookmarks";
interface BookmarkButtonProps {
  projectId: string;
  size?: "sm" | "default";
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  projectId,
  size = "default",
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookmarkedIds, toggle } = useBookmarks();
  const [animating, setAnimating] = useState(false);

  const isBookmarked = bookmarkedIds.has(projectId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    setAnimating(true);
    await toggle(projectId);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this project"}
      className={`
        inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all duration-200
        ${isBookmarked ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}
        ${animating ? "scale-110" : "scale-100"}
        ${className}
      `}
    >
      <Bookmark
        className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} transition-all ${
          isBookmarked ? "fill-blue-600" : "fill-none"
        }`}
      />
      {showLabel && (
        <span className="text-sm font-medium">{isBookmarked ? "Saved" : "Save"}</span>
      )}
    </button>
  );
}


interface ExpressInterestModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}


export function ExpressInterestModal({
  projectId,
  projectTitle,
  isOpen,
  onClose,
}: ExpressInterestModalProps) {
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
  if (!message.trim()) {
    showToast({ type: "warning", title: "Message required", message: "Please write a short message." });
    return;
  }
  try {
    setSubmitting(true);
    await api.post(`/bookmarks/interests/${projectId}`, { message });
    showToast({ 
      type: "success", 
      title: "Interest sent!", 
      message: "Your message was sent — check your Messages page to continue the conversation." 
    });
    setMessage("");
    onClose();
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Something went wrong";
    showToast({ type: "error", title: "Failed", message: msg });
  } finally {
    setSubmitting(false);
  }
};


return (
  <div onClick={(e) => e.stopPropagation()}>
    <AppModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Express Interest"
      description={`Send a message to the team behind "${projectTitle}"`}
      submitText={submitting ? "Sending..." : "Send Interest"}
      cancelText="Cancel"
      onSubmit={handleSubmit}
    >
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        maxLength={500}
        placeholder="Introduce yourself and explain why you're interested in this project..."
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
      />
      <p className="text-xs text-gray-400 text-right">{message.length}/500</p>
    </AppModal>
  </div>
);
  
}


export function InterestButton({
  projectId,
  projectTitle,
  ownerId,
}: {
  projectId: string;
  projectTitle: string;
  ownerId: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    if (user.id === ownerId) return;
    setOpen(true);
  };

  if (user?.id === ownerId) return null;

  return (
    <>
      <button
        onClick={handleClick}
        title="Express interest in this project"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>
      <ExpressInterestModal
        projectId={projectId}
        projectTitle={projectTitle}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}


type Project = {
  id: string;
  title: string;
  tagline: string;
  industry: string;
  stage: "IDEA" | "PROTOTYPE" | "MVP" | "GROWTH" | "SCALING";
  featured: boolean;
  technologies: string[];
  fundingSought: number;
  currency: string;
  location: string;
  viewCount: number;
  owner: { name: string };
};

const stageColors: Record<string, string> = {
  IDEA:      "bg-gray-100 text-gray-700",
  PROTOTYPE: "bg-blue-100 text-blue-700",
  MVP:       "bg-indigo-100 text-indigo-700",
  GROWTH:    "bg-purple-100 text-purple-700",
  SCALING:   "bg-green-100 text-green-700",
};

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function SavedProjectsPage() {
  const { bookmarkedIds, toggle } = useBookmarks();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bookmarks")
      .then(({ data }) => setProjects(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayedProjects = projects.filter((p) => bookmarkedIds.has(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Saved Projects</h1>
        <p className="text-gray-500 text-sm mt-1">Projects you've bookmarked for later.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No saved projects yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Browse the gallery and click the bookmark icon to save projects here.
          </p>
          <Link to="/app/projects">
            <Button variant="outline">Browse Projects</Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{displayedProjects.length}</span>{" "}
            saved project{displayedProjects.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map((project) => (
              <Link key={project.id} to={`/app/startup/projects/${project.id}`}>
                <Card className="bg-white shadow-sm hover:shadow-lg transition-all duration-200 h-full cursor-pointer group relative">
                  <CardContent className="pt-6">
                    <button
                      title="Remove bookmark"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void toggle(project.id);
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
                    >
                      <Bookmark className="w-4 h-4 fill-blue-600" />
                    </button>

                    {project.featured && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          <Sparkles className="size-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors pr-8">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.tagline}</p>

                    <div className="mb-4">
                      <Badge className={stageColors[project.stage]}>{project.stage}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies?.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs border-indigo-200 text-indigo-700">
                          {tech}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="size-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {formatCurrency(Number(project.fundingSought))}
                        </span>
                        <span>funding</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="size-4" />
                        <span>{project.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="size-4" />
                        <span>{project.owner.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="size-4" />
                        <span>{project.viewCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}