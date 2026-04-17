import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  DollarSign,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Bookmark,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import api from "../../services/axios";
import { useAuth } from "../../hooks/useAuth";

interface EarningsData {
  totalEarned: number;
  completedSessions: number;
  pendingEarnings: number;
  upcomingSessions: number;
  thisMonthEarned: number;
  thisMonthSessions: number;
}


interface ProfileFields {
  avatar?: string | null;
  bio?: string | null;
  hourlyRate?: number | null;
  expertise?: string[];
  yearsOfExperience?: number | null;
  location?: string | null;
}
const getProfileCompleteness = (profile: ProfileFields | null | undefined) => {
  const fields = [
    { label: "Profile photo", done: !!profile?.avatar },
    { label: "Bio", done: !!profile?.bio },
    { label: "Hourly rate", done: !!profile?.hourlyRate },
    { label: "Expertise areas", done: (profile?.expertise?.length ?? 0) > 0 },
    { label: "Years of experience", done: !!profile?.yearsOfExperience },
    { label: "Location", done: !!profile?.location },
  ];

  const completed = fields.filter((f) => f.done).length;
  const percent = Math.round((completed / fields.length) * 100);
  const missing = fields.filter((f) => !f.done);

  return { percent, missing };
};

export function ExpertDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarned: 0,
    completedSessions: 0,
    pendingEarnings: 0,
    upcomingSessions: 0,
    thisMonthEarned: 0,
    thisMonthSessions: 0,
  });
  const [loadingEarnings, setLoadingEarnings] = useState(true);

  useEffect(() => {
    api
      .get("/consultations/earnings")
      .then(({ data }) => setEarnings(data))
      .catch(console.error)
      .finally(() => setLoadingEarnings(false));
  }, []);

  const { percent, missing } = getProfileCompleteness(user?.profile);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            Here's an overview of your consulting activity
          </p>
        </div>

        {/* ── Profile Completeness Prompt (hide when 100%) ── */}
        {percent < 100 && (
          <Card className="border-l-4 border-l-yellow-400">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="size-5 text-yellow-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800">
                      Complete your profile
                    </p>
                    <span className="text-sm font-medium text-yellow-600">
                      {percent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Missing fields */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {missing.map((f) => (
                      <Badge
                        key={f.label}
                        className="bg-yellow-50 text-yellow-700 border border-yellow-200"
                      >
                        + {f.label}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => navigate(`/app/profile/${user?.id}`)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Complete Profile
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Earnings Stats ── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-indigo-600" />
            Earnings Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Earned */}
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Earned</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loadingEarnings
                        ? "..."
                        : `$${earnings.totalEarned.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {earnings.completedSessions} completed sessions
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="size-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* This Month */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loadingEarnings
                        ? "..."
                        : `$${earnings.thisMonthEarned.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {earnings.thisMonthSessions} sessions this month
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="size-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Upcoming Earnings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {loadingEarnings
                        ? "..."
                        : `$${earnings.pendingEarnings.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {earnings.upcomingSessions} confirmed sessions
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="size-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Profile Stats ── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="size-5 text-yellow-500" />
            Your Profile Stats
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rating */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ★ {user?.profile?.avgRating?.toFixed(1) ?? "0.0"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {user?.profile?.reviewCount ?? 0} reviews
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Star className="size-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Sessions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sessions Done</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {earnings.completedSessions}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Total completed consultations
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <CheckCircle2 className="size-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Rate */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {user?.profile?.hourlyRate
                        ? `$${user.profile.hourlyRate}/hr`
                        : "Not set"}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <DollarSign className="size-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/app/expert/reservations")}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Calendar className="size-4 mr-2" />
              Manage Reservations
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/app/profile/${user?.id}`)}
            >
              Edit Profile
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/saved")}>
              <Bookmark className="size-4 mr-2" />
              Saved Projects
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/app/events/my")}
            >
              <Calendar className="size-4 mr-2" />
              My Events
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
