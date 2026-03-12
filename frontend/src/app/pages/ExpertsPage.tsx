import { useEffect, useState} from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Star, Search, SlidersHorizontal, X } from "lucide-react";
import api from "../../services/axios";

interface Expert {
  id: string;
  name: string;
  profile: {
    avatar?: string;
    bio?: string;
    expertise: string[];
    industries: string[];
    hourlyRate?: number;
    currency?: string;
    yearsOfExperience?: number;
    avgRating: number;
    reviewCount: number;
    availabilityStatus: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  };
}

interface Pagination {
  total: number;
  page: number;
  totalPages: number;
}

const EXPERTISE_OPTIONS = [
  "Business Strategy", "Marketing", "Finance", "Technology",
  "Design", "Legal", "HR", "Sales", "Operations", "Product",
];

const INDUSTRY_OPTIONS = [
  "Technology", "Healthcare", "Finance", "Education",
  "E-commerce", "Manufacturing", "Media", "Real Estate",
];

export default function ExpertsPage() {
  const navigate = useNavigate();

  const [experts, setExperts] = useState<Expert[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [expertise, setExpertise] = useState("");
  const [industry, setIndustry] = useState("");
  const [maxRate, setMaxRate] = useState(500);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("rating");
  const [page, setPage] = useState(1);

useEffect(() => {
  let cancelled = false;

  const params = new URLSearchParams();
  if (expertise) params.set("expertise", expertise);
  if (industry) params.set("industry", industry);
  if (maxRate < 500) params.set("maxRate", String(maxRate));
  if (minRating > 0) params.set("minRating", String(minRating));
  params.set("sort", sort);
  params.set("page", String(page));
  params.set("limit", "12");

  // ✅ Use a timeout to avoid cascade — sets loading before paint
  const timer = setTimeout(() => {
    if (!cancelled) setLoading(true);
  }, 0);

  api.get(`/experts?${params.toString()}`)
    .then(({ data }) => {
      if (!cancelled) {
        setExperts(data.experts);
        setPagination(data.pagination);
        setLoading(false);
      }
    })
    .catch((err) => {
      if (!cancelled) {
        console.error(err);
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}, [expertise, industry, maxRate, minRating, sort, page]);
  // Filter by name client-side
  const filtered = experts.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.profile.expertise.some((ex) =>
      ex.toLowerCase().includes(search.toLowerCase())
    )
  );

  const hasActiveFilters =
    expertise || industry || maxRate < 500 || minRating > 0;

  const clearFilters = () => {
    setExpertise("");
    setIndustry("");
    setMaxRate(500);
    setMinRating(0);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Find an Expert</h1>
        <p className="text-gray-500 mt-1">
          Connect with experienced professionals for your business needs
        </p>
      </div>

      {/* ── SEARCH + SORT BAR ── */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search by name or expertise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="rate_asc">Lowest Rate</SelectItem>
            <SelectItem value="rate_desc">Highest Rate</SelectItem>
            <SelectItem value="experience">Most Experienced</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className={`gap-2 ${hasActiveFilters ? "border-indigo-500 text-indigo-600" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {hasActiveFilters && (
            <Badge className="bg-indigo-600 text-white text-xs px-1.5">
              ON
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* ── FILTERS PANEL ── */}
      {showFilters && (
        <Card className="border-indigo-100">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* Expertise */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Expertise</p>
                <Select
                  value={expertise || "all"}
                  onValueChange={(v) => {
                    setExpertise(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All expertise</SelectItem>
                    {EXPERTISE_OPTIONS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Industry</p>
                <Select
                  value={industry || "all"}
                  onValueChange={(v) => {
                    setIndustry(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All industries</SelectItem>
                    {INDUSTRY_OPTIONS.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Rate */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Max Rate: <span className="text-indigo-600">${maxRate}/hr</span>
                </p>
                <Slider
                  min={10}
                  max={500}
                  step={10}
                  value={[maxRate]}
                  onValueChange={([v]) => { setMaxRate(v); setPage(1); }}
                  className="mt-2"
                />
              </div>

              {/* Min Rating */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Min Rating: <span className="text-indigo-600">{minRating}★</span>
                </p>
                <Slider
                  min={0}
                  max={5}
                  step={0.5}
                  value={[minRating]}
                  onValueChange={([v]) => { setMinRating(v); setPage(1); }}
                  className="mt-2"
                />
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* ── RESULTS COUNT ── */}
      <p className="text-sm text-gray-500">
        {loading ? "Loading..." : `${pagination.total} experts found`}
      </p>

      {/* ── EXPERT GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <div className="flex gap-3">
                  <div className="size-14 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No experts found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((expert) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              onClick={() => navigate(`/app/profile/${expert.id}`)}
              onBook={() => navigate(`/app/experts/${expert.id}/book`)}
            />
          ))}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i + 1)}
                className={`size-9 rounded-md text-sm font-medium transition-colors ${
                  page === i + 1
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ExpertCard({
  expert,
  onClick,
  onBook, 
}: {
  expert: Expert;
  onClick: () => void;
  onBook: () => void; 
}) {
  const { profile } = expert;

  const statusColor = {
    AVAILABLE: "bg-green-100 text-green-700",
    BUSY: "bg-orange-100 text-orange-700",
    UNAVAILABLE: "bg-gray-100 text-gray-500",
  }[profile.availabilityStatus];

  const statusLabel = {
    AVAILABLE: "Available",
    BUSY: "Busy",
    UNAVAILABLE: "Unavailable",
  }[profile.availabilityStatus];

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
      onClick={onClick}
    >
      <CardContent className="pt-6 space-y-4">

        {/* Header */}
        <div className="flex gap-3 items-start">
          {/* Avatar */}
          <div className="size-14 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={expert.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-indigo-600">
                {expert.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
              {expert.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="size-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-gray-700">
                {profile.avgRating?.toFixed(1) ?? "0.0"}
              </span>
              <span className="text-xs text-gray-400">
                ({profile.reviewCount} reviews)
              </span>
            </div>

            {/* Status + Experience */}
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs px-2 py-0 ${statusColor}`}>
                {statusLabel}
              </Badge>
              {profile.yearsOfExperience && (
                <span className="text-xs text-gray-500">
                  {profile.yearsOfExperience} yrs exp
                </span>
              )}
            </div>
          </div>

          {/* Rate */}
          {profile.hourlyRate && (
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-indigo-600">
                ${Number(profile.hourlyRate)}
              </p>
              <p className="text-xs text-gray-400">/hour</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
        )}

        {/* Expertise tags */}
        {profile.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.expertise.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0"
              >
                {tag}
              </Badge>
            ))}
            {profile.expertise.length > 3 && (
              <Badge className="bg-gray-100 text-gray-500 text-xs px-2 py-0">
                +{profile.expertise.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Industries */}
        {profile.industries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.industries.slice(0, 2).map((ind) => (
              <Badge key={ind} variant="outline" className="text-xs px-2 py-0">
                {ind}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
          disabled={profile.availabilityStatus !== "AVAILABLE"}
          onClick={(e) => {
    e.stopPropagation();
    onBook(); 
  }}
        >
          {profile.availabilityStatus === "AVAILABLE"
            ? "Book Consultation"
            : "View Profile"}
        </Button>

      </CardContent>
    </Card>
  );
}