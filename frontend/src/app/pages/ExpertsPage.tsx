import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Star, Search } from "lucide-react";
import api from "../../services/axios";

interface Expert {
  id: string;
  name: string;
  profile?: {
    avatar?: string;
    bio?: string;
    expertise?: string[];
    industries?: string[];
    hourlyRate?: number;
    currency?: string;
    yearsOfExperience?: number;
    avgRating?: number;
    reviewCount?: number;
    availabilityStatus?: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  };
}

export default function ExpertsPage() {
  const navigate = useNavigate();

  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/experts`)
      .then(({ data }) => {
        if (!cancelled) {
          setExperts(data.experts);
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
    };
  }, []);

  const filtered = experts.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.profile?.expertise?.some((ex) =>
        ex.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Find an Expert</h1>
        <p className="text-gray-500 mt-1">
          Connect with experienced professionals for your business needs
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Search by name or expertise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* RESULTS COUNT */}
      <p className="text-sm text-gray-500">
        {loading ? "Loading..." : `${filtered.length} experts found`}
      </p>

      {/* EXPERT GRID */}
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
          <p className="text-sm mt-1">Try a different search</p>
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
  if (!profile) return null;
  const availabilityStatus = profile.availabilityStatus ?? "UNAVAILABLE";

  const statusColor = {
    AVAILABLE: "bg-green-100 text-green-700",
    BUSY: "bg-orange-100 text-orange-700",
    UNAVAILABLE: "bg-gray-100 text-gray-500",
  }[availabilityStatus];

  const statusLabel = {
    AVAILABLE: "Available",
    BUSY: "Busy",
    UNAVAILABLE: "Unavailable",
  }[availabilityStatus];

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
      onClick={onClick}
    >
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-3 items-start">
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
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="size-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-gray-700">
                {profile.avgRating?.toFixed(1) ?? "0.0"}
              </span>
              <span className="text-xs text-gray-400">
                ({profile.reviewCount} reviews)
              </span>
            </div>
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

          {profile.hourlyRate && (
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-indigo-600">
                ${Number(profile.hourlyRate)}
              </p>
              <p className="text-xs text-gray-400">/hour</p>
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
        )}

        {(profile.expertise?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.expertise?.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0"
              >
                {tag}
              </Badge>
            ))}
            {(profile.expertise?.length ?? 0) > 3 && (
              <Badge className="bg-gray-100 text-gray-500 text-xs px-2 py-0">
                +{(profile.expertise?.length ?? 0) - 3}
              </Badge>
            )}
          </div>
        )}

        {(profile.industries?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.industries?.slice(0, 2).map((ind) => (
              <Badge key={ind} variant="outline" className="text-xs px-2 py-0">
                {ind}
              </Badge>
            ))}
          </div>
        )}

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
