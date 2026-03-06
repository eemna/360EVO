import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { MessageSquare, DollarSign, UserPlus } from "lucide-react";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import api from "../../services/axios";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { useAuth } from "../../hooks/useAuth";
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

  owner?: {
    name: string;
    email: string;
  };
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

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [joinTeamModalOpen, setJoinTeamModalOpen] = useState(false);
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        setProject({
          ...res.data,
          fundingSought:
            res.data.fundingSought !== null &&
            res.data.fundingSought !== undefined
              ? Number(res.data.fundingSought)
              : 0,
        });
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id]);

  const handleBack = () => {
    window.history.back();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 pt-6">
          <Skeleton className="h-8 w-40 mb-4" />
        </div>

        {/* Hero */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            {/* badges */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* title */}
            <Skeleton className="h-10 w-2/3" />

            {/* tagline */}
            <Skeleton className="h-6 w-1/2" />

            {/* meta row */}
            <div className="flex gap-4 flex-wrap">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-40" />
            </div>

            {/* buttons */}
            <div className="flex gap-4">
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
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

          {/* right column */}
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
  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Connect form submitted");
    setConnectModalOpen(false);
  };

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Invest form submitted");
    setInvestModalOpen(false);
  };

  const handleJoinTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Join team form submitted");
    setJoinTeamModalOpen(false);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-0">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={handleBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <MessageSquare className="size-6 text-indigo-600" />
              Connect with Founder
            </DialogTitle>
            <DialogDescription>
              Send a direct message to start a conversation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConnectSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Partnership opportunity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain why you'd like to connect..."
                  rows={5}
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConnectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invest Modal */}
      <Dialog open={investModalOpen} onOpenChange={setInvestModalOpen}>
        <DialogContent className="sm:max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="size-6 text-green-600" />
              Investment Interest
            </DialogTitle>
            <DialogDescription>
              Express your interest in investing in {project.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvestSubmit}>
            <div className="space-y-4 py-4">
              {/* Funding Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Startup</p>
                <p className="font-semibold text-lg">{project.title}</p>
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-gray-600">Stage:</span>
                  <span className="font-medium">{project.stage}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      project.fundingSought ?? 0,
                      project.currency,
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investment-amount">Investment Amount ($)</Label>
                <Input
                  id="investment-amount"
                  type="number"
                  placeholder="50000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investor-type">Investor Type</Label>
                <Select required>
                  <SelectTrigger id="investor-type">
                    <SelectValue placeholder="Select investor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vc">Venture Capital</SelectItem>
                    <SelectItem value="angel">Angel Investor</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investment-message">Message</Label>
                <Textarea
                  id="investment-message"
                  placeholder="Share your investment thesis and what value you can bring..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInvestModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Submit Investment Interest
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Team Modal */}
      <Dialog open={joinTeamModalOpen} onOpenChange={setJoinTeamModalOpen}>
        <DialogContent className="sm:max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="size-6 text-purple-600" />
              Join This Startup
            </DialogTitle>
            <DialogDescription>
              Apply to collaborate or join the team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinTeamSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select required>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="ai-engineer">AI Engineer</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio / LinkedIn URL</Label>
                <Input
                  id="portfolio"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">Why do you want to join?</Label>
                <Textarea
                  id="motivation"
                  placeholder="Tell us about your motivation and what you can bring to the team..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setJoinTeamModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="max-w-4xl">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge
                className={`${stageColors[project.stage as keyof typeof stageColors]} px-4 py-2 text-sm flex items-center gap-2`}
              >
                <Sparkles className="size-4" />
                {project.stage}
              </Badge>
              <Badge
                className={`${statusColors[project.status as keyof typeof statusColors]} px-4 py-2 text-sm`}
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

            {/* Title */}
            <h1 className="text-3xl mb-4 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
              {project.title}
            </h1>

            {/* Tagline */}
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              {project.tagline}
            </p>

            {/* Meta Info */}
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

            {/* Technology Tags */}
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

            {/* Action Buttons */}
            {canInteract && (
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 gap-2"
                  onClick={() => setConnectModalOpen(true)}
                >
                  <MessageSquare className="size-5" />
                  Connect with Founder
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 gap-2"
                  onClick={() => setInvestModalOpen(true)}
                >
                  <DollarSign className="size-5" />
                  Invest
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 gap-2"
                  onClick={() => setJoinTeamModalOpen(true)}
                >
                  <UserPlus className="size-5" />
                  Join Team
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-600 mb-4">{project.shortDesc}</p>
                  <div
                    className="text-gray-600 leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: project.fullDesc }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team Section */}
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

            {/* Roadmap Section */}
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
                          className={`relative z-10 size-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            milestone.completedAt
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
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
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Funding Section */}
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

            {/* Documents Section */}
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

            {/* Project Metadata */}
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
          </div>
        </div>
      </div>

      {/* Connect Modal */}

      {/* Invest Modal */}

      {/* Join Team Modal */}
    </div>
  );
}
