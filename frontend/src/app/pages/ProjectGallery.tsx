import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, MapPin, Target, Eye, Users, Sparkles } from "lucide-react";
import api from "../../services/axios";
import { BookmarkButton, InterestButton } from "./Bookmarkfeature";

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
  owner: {
    id: string;
    name: string;
  };
};

const stageColors = {
  IDEA: "bg-gray-100 text-gray-700",
  PROTOTYPE: "bg-blue-100 text-blue-700",
  MVP: "bg-indigo-100 text-indigo-700",
  GROWTH: "bg-purple-100 text-purple-700",
  SCALING: "bg-green-100 text-green-700",
};

const ITEMS_PER_PAGE = 6;

export function ProjectGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [fundingRangeFilter, setFundingRangeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        let minFunding: number | undefined;
        let maxFunding: number | undefined;

        if (fundingRangeFilter === "0-500k") {
          minFunding = 0;
          maxFunding = 500000;
        } else if (fundingRangeFilter === "500k-1m") {
          minFunding = 500000;
          maxFunding = 1000000;
        } else if (fundingRangeFilter === "1m-5m") {
          minFunding = 1000000;
          maxFunding = 5000000;
        } else if (fundingRangeFilter === "5m+") {
          minFunding = 5000000;
        }

        const response = await api.get("/projects/", {
          params: {
            q: searchQuery || undefined,
            industry: industryFilter !== "all" ? industryFilter : undefined,
            stage: stageFilter !== "all" ? stageFilter : undefined,
            minFunding,
            maxFunding,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          },
        });

        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [
    searchQuery,
    industryFilter,
    stageFilter,
    fundingRangeFilter,
    currentPage,
  ]);

  const industries = Array.from(
    new Set(projects.map((p) => p.industry)),
  ).filter(Boolean);

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const handleFilterChange = () => setCurrentPage(1);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Project Gallery
        </h1>
        <p className="text-gray-600 mt-1">
          Discover innovative startups and investment opportunities
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search projects by title or tagline or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select
                value={industryFilter}
                onValueChange={(v) => {
                  setIndustryFilter(v);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={stageFilter}
                onValueChange={(v) => {
                  setStageFilter(v);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="IDEA">Idea</SelectItem>
                  <SelectItem value="PROTOTYPE">Prototype</SelectItem>
                  <SelectItem value="MVP">MVP</SelectItem>
                  <SelectItem value="GROWTH">Growth</SelectItem>
                  <SelectItem value="SCALING">Scaling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Select
              value={fundingRangeFilter}
              onValueChange={(v) => {
                setFundingRangeFilter(v);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="All Funding Ranges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funding Ranges</SelectItem>
                <SelectItem value="0-500k">$0 - $500K</SelectItem>
                <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                <SelectItem value="5m+">$5M+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-white shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex justify-between pt-4 border-t">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="size-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {projects.map((project) => (
            <Link key={project.id} to={`/app/startup/projects/${project.id}`}>
              <Card className="bg-white shadow-sm hover:shadow-lg transition-all duration-200 h-full cursor-pointer group">
                <CardContent className="pt-6">
                  {project.featured && (
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Sparkles className="size-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.tagline}
                  </p>

                  <div className="mb-4">
                    <Badge className={stageColors[project.stage]}>
                      {project.stage}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies?.slice(0, 3).map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="text-xs border-indigo-200 text-indigo-700"
                      >
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

                  {/* ── Footer: owner + views + bookmark + interest ── */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="size-4" />
                      <span>{project.owner.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500 mr-1">
                        <Eye className="size-4" />
                        <span>{project.viewCount.toLocaleString()}</span>
                      </div>

                      {/* ── BOOKMARK BUTTON ── */}
                      <BookmarkButton projectId={project.id} />

                      {/* ── INTEREST BUTTON ── */}
                      <InterestButton
                        projectId={project.id}
                        projectTitle={project.title}
                        ownerId={project.owner.id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
