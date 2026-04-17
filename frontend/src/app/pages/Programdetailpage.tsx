import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useAuth } from "../../hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Rocket,
  TrendingUp,
  BookOpen,
  Star,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string;
  type: "INCUBATION" | "ACCELERATION" | "MENTORSHIP";
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  capacity: number;
  benefits: string[];
  requirements: string[];
  status: "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED";
  coverImage: string | null;
  organizer: { name: string };
  _count: { applications: number; participants: number };
}
type ProjectStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
};
const TYPE_CONFIG = {
  INCUBATION: { label: "Incubation", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
  ACCELERATION: { label: "Acceleration", icon: Rocket, color: "text-orange-600 bg-orange-50" },
  MENTORSHIP: { label: "Mentorship", icon: TrendingUp, color: "text-green-600 bg-green-50" },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

// Application Modal
function ApplicationModal({
  open,
  onOpenChange,
  program,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  program: Program;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const { showToast } = useToast();
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [goals, setGoals] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (open && user?.role === "STARTUP") {
      api.get("/projects/mine").then(({ data }) => setProjects(data)).catch(() => {});
    }
  }, [open, user]);
  const handleSubmit = async () => {
    if (!motivation.trim()) {
      showToast({ type: "error", title: "Please fill in your motivation", message: "" });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/programs/${program.id}/apply`, {
        responses: { motivation, experience, goals },
        projectId: selectedProjectId === "none" ? null : selectedProjectId,
      });
      showToast({
        type: "success",
        title: "Application submitted!",
        message: "We'll notify you when your application is reviewed.",
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to submit application";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Apply to {program.title}</DialogTitle>
          <DialogDescription>
            Complete the application form below. All fields help us evaluate your fit for the program.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Program summary */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-900">
                {TYPE_CONFIG[program.type].label} Program
              </span>
            </div>
            <p className="text-xs text-indigo-700">
              Starts {formatDate(program.startDate)} · {program.capacity} spots ·
              Deadline {formatDate(program.applicationDeadline)}
            </p>
          </div>

          {/* Motivation */}
          <div className="space-y-2">
            <Label htmlFor="motivation">
              Why do you want to join this program? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivation"
              placeholder="Describe your motivation and what you hope to achieve..."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 text-right">{motivation.length}/1000</p>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">
              Relevant experience <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="experience"
              placeholder="Tell us about your background, startup stage, and relevant achievements..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              maxLength={800}
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals">
              What are your specific goals? <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="goals"
              placeholder="List 2-3 concrete outcomes you want to achieve during the program..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              maxLength={600}
            />
          </div>
{user?.role === "STARTUP" && projects.length > 0 && (
      <div className="space-y-2">
        <Label>Attach a Project <span className="text-gray-400 text-xs">(optional)</span></Label>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger><SelectValue placeholder="Select a project..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {projects
            .filter((p) => p.status === "APPROVED")
            .map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}
          {/* Requirements reminder */}
          {program.requirements.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                <AlertCircle className="size-3" />
                Program Requirements
              </p>
              <ul className="space-y-1">
                {program.requirements.map((req, i) => (
                  <li key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
                    <ChevronRight className="size-3 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !motivation.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {submitting ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="size-4" />}
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
const isAdmin = user?.role === "ADMIN";
  const fetchProgram = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/programs/${id}`);
      setProgram(data);
    } catch {
      showToast({ type: "error", title: "Program not found", message: "" });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      setCheckingApplication(true);
      const { data } = await api.get("/programs/my-applications");
      const applied = data.some(
        (app: { program: { id: string } }) => app.program.id === id,
      );
      setHasApplied(applied);
    } catch {
      // ignore
    } finally {
      setCheckingApplication(false);
    }
  };

  useEffect(() => {
    fetchProgram();
    if (user) checkExistingApplication();
    else setCheckingApplication(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!program) return null;

  const TypeIcon = TYPE_CONFIG[program.type].icon;
  const days = daysUntil(program.applicationDeadline);
  const spotsLeft = program.capacity - program._count.participants;
  const isOpen = program.status === "OPEN";
  const canApply = isOpen && spotsLeft > 0 && days >= 0 && !hasApplied;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-1 text-gray-500 -ml-2"
      >
        <ArrowLeft className="size-4" />
        Back to Programs
      </Button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200">
        <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100">
          {program.coverImage && (
            <img
              src={program.coverImage}
              alt={program.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_CONFIG[program.type].color}`}
            >
              <TypeIcon className="size-3" />
              {TYPE_CONFIG[program.type].label}
            </span>
            <Badge
              className={
                isOpen
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }
            >
              {program.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-white">{program.title}</h1>
          <p className="text-sm text-white/80 mt-1">by {program.organizer.name}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">About This Program</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {program.description}
              </p>
            </CardContent>
          </Card>

          {/* Benefits */}
          {program.benefits.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="size-4 text-amber-500" />
                  What You'll Get
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {program.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {program.requirements.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {program.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <ChevronRight className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Apply card */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white sticky top-4">
            <CardContent className="pt-5 pb-5 space-y-4">
              {/* Stats */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    Capacity
                  </span>
                  <span className="font-semibold text-gray-800">
                    {program.capacity} participants
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    Spots Left
                  </span>
                  <span
                    className={`font-semibold ${
                      spotsLeft <= 5 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {spotsLeft > 0 ? spotsLeft : "Full"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Starts
                  </span>
                  <span className="font-medium text-gray-700">
                    {formatDate(program.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Ends
                  </span>
                  <span className="font-medium text-gray-700">
                    {formatDate(program.endDate)}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              {isOpen && days >= 0 && (
                <div
                  className={`rounded-xl p-3 text-center ${
                    days <= 7 ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Clock
                    className={`size-4 mx-auto mb-1 ${
                      days <= 7 ? "text-red-500" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-xs font-semibold ${
                      days <= 7 ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {days === 0 ? "Deadline today!" : `${days} days to apply`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Deadline: {formatDate(program.applicationDeadline)}
                  </p>
                </div>
              )}

{/* CTA */}
{!user ? (
  <Button
    className="w-full bg-indigo-600 hover:bg-indigo-700"
    onClick={() => navigate("/login")}
  >
    Log in to Apply
  </Button>
) : checkingApplication ? (
  <Button className="w-full" disabled>
    <LoadingSpinner size="sm" />
  </Button>
) : hasApplied ? (
  <div className="flex items-center gap-2 justify-center p-3 bg-green-50 border border-green-200 rounded-xl">
    <CheckCircle2 className="size-4 text-green-600" />
    <span className="text-sm font-medium text-green-700">
      Application Submitted
    </span>
  </div>
) : canApply ? (
  <Button
    className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
    onClick={() => setApplyOpen(true)}
  >
    <Rocket className="size-4" />
    Apply Now
  </Button>
) : (
  <Button className="w-full" disabled>
    {!isOpen
      ? program.status === "CLOSED" ? "Applications Closed" : program.status
      : spotsLeft === 0
      ? "Program Full"
      : days < 0
      ? "Deadline Passed"
      : "Unavailable"}
  </Button>
)}

{!isAdmin && (
  <Button
    variant="ghost"
    size="sm"
    className="w-full text-xs text-indigo-600"
    onClick={() => navigate("/app/programs/my-applications")}
  >
    View my applications →
  </Button>
)}
              {isAdmin && (
  <Button
    variant="outline"
    size="sm"
    className="w-full text-xs gap-1.5"
    onClick={() => navigate(`/app/programs/${program.id}/edit`)}
  >
    Edit Program
  </Button>
)}
            </CardContent>
          </Card>

          {/* Applications count */}
          <Card className="border border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Applications received</span>
                <span className="font-semibold text-gray-800">
                  {program._count.applications}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Modal */}
      {program && (
        <ApplicationModal
          open={applyOpen}
          onOpenChange={setApplyOpen}
          program={program}
          onSuccess={() => {
            setHasApplied(true);
            fetchProgram();
          }}
        />
      )}
    </div>
  );
}