import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import {
  Briefcase,
  Calendar,
  Star,
  Clock,
  Video,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { format } from "date-fns";
import api from "../../services/axios";
import type { User } from "../../context/AuthContext";

interface Booking {
  id: string;
  startDateTime: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED" | "CANCELLED";
  duration: number;
  price: number;
  topic: string;
  meetingType?: "VIDEO" | "IN_PERSON";
  meetingLink?: string;
  location?: string;
  expert?: { id: string; name: string };
  review?: { id: string } | null;
}

interface ExpertProfileProps {
  profileUser: User;
}

export default function ExpertProfile({ profileUser }: ExpertProfileProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewedIds] = useState<Set<string>>(new Set());

  const isOwnProfile = user?.id === profileUser.id;

  useEffect(() => {
    if (!user || isOwnProfile) return;
    if (!["MEMBER", "STARTUP", "ADMIN"].includes(user.role)) return;
    let cancelled = false;

    api
      .get("/consultations")
      .then(({ data }) => {
        if (!cancelled) {
          setMyBookings(
            data.filter((b: Booking) => b.expert?.id === profileUser.id),
          );
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [user, profileUser.id, isOwnProfile]);

  if (!profileUser.profile) return null;

  const profile = profileUser.profile;
  const computedStatus = profileUser.computedStatus ?? "AVAILABLE";

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const reviews = profileUser.expertReviews ?? [];

  const handleSubmitReview = () => {
    if (!reviewBooking || reviewRating === 0) return;

    api
      .post(`/consultations/${reviewBooking.id}/review`, {
        rating: reviewRating,
        comment: reviewComment,
      })
      .then(({ data }) => {
        setMyBookings((prev) =>
          prev.map((b) =>
            b.id === reviewBooking.id ? { ...b, review: data } : b,
          ),
        );
        setReviewBooking(null);
        setReviewRating(0);
        setReviewComment("");
      })
      .catch(console.error);
  };

  return (
    <div className="space-y-6">
      {/* ── PROFESSIONAL INFO ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-5 text-indigo-600" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                Years of Experience
              </p>
              <p className="text-3xl font-bold text-indigo-600">
                {profile.yearsOfExperience ?? "—"}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="size-5 text-yellow-400 fill-yellow-400" />
                <p className="text-3xl font-bold text-indigo-600">
                  {profile.avgRating?.toFixed(1) ?? "0.0"}
                </p>
                <p className="text-sm text-gray-500">
                  ({profile.reviewCount ?? 0} reviews)
                </p>
              </div>
            </Card>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Industries</p>
            <div className="flex flex-wrap gap-2">
              {profile.industries?.map((ind: string) => (
                <Badge key={ind} variant="secondary">
                  {ind}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Areas of Expertise
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.expertise?.map((skill: string) => (
                <Badge key={skill} className="bg-indigo-100 text-indigo-700">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {profile.certifications?.map((cert: string) => (
                <Badge key={cert} variant="outline">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── WEEKLY AVAILABILITY ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-indigo-600" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Day</TableHead>
                  <TableHead className="font-semibold">Start Time</TableHead>
                  <TableHead className="font-semibold">End Time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(profile.weeklyAvailability ?? []).map((slot) => (
                  <TableRow
                    key={slot.id}
                    className={!slot.enabled ? "bg-gray-50" : ""}
                  >
                    <TableCell className="font-medium">
                      {dayNames[slot.day]}
                    </TableCell>
                    <TableCell>{slot.enabled ? slot.startTime : "—"}</TableCell>
                    <TableCell>{slot.enabled ? slot.endTime : "—"}</TableCell>
                    <TableCell>
                      {slot.enabled ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Available
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-200">
                          Unavailable
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── BOOK BUTTON ── */}
      {!isOwnProfile &&
        ["MEMBER", "STARTUP", "ADMIN"].includes(user?.role ?? "") && (
          <Card className="border-2 border-indigo-100">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  Book a session with {profileUser.name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {computedStatus === "AVAILABLE"
                    ? "Currently available for consultations"
                    : "Currently not available"}
                </p>
              </div>
              <Button
                disabled={computedStatus !== "AVAILABLE"}
                onClick={() => navigate(`/app/experts/${profileUser.id}/book`)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {computedStatus === "AVAILABLE"
                  ? "Book Consultation"
                  : "Unavailable"}
              </Button>
            </CardContent>
          </Card>
        )}

      {/* ── MANAGE RESERVATIONS (expert own profile) ── */}
      {isOwnProfile && (
        <Card className="border-2 border-indigo-100">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Your Consultations</p>
              <p className="text-sm text-gray-500 mt-0.5">
                View and manage your booking requests
              </p>
            </div>
            <Button
              onClick={() => navigate("/app/expert/reservations")}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Manage Reservations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── MY CONSULTATIONS WITH THIS EXPERT (member only) ── */}
      {!isOwnProfile && myBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-indigo-600" />
              My Consultations with {profileUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 border border-gray-300 rounded-lg space-y-3 bg-gray-50"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {booking.topic}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(
                        new Date(booking.startDateTime),
                        "EEEE, MMMM d yyyy",
                      )}
                      {" · "}
                      {format(new Date(booking.startDateTime), "HH:mm")}
                      {" · "}
                      {booking.duration} min
                    </p>
                  </div>

                  {/* Status badge */}
                  {booking.status === "PENDING" && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      Awaiting Confirmation
                    </Badge>
                  )}
                  {booking.status === "ACCEPTED" && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Confirmed 
                    </Badge>
                  )}
                  {booking.status === "COMPLETED" && (
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                      Completed
                    </Badge>
                  )}
                  {booking.status === "DECLINED" && (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      Declined
                    </Badge>
                  )}
                  {booking.status === "CANCELLED" && (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      Cancelled
                    </Badge>
                  )}
                </div>

                {/* Meeting info */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="size-4" />
                    <span>${booking.price}</span>
                  </div>
                  {booking.meetingType === "VIDEO" ? (
                    <div className="flex items-center gap-1.5">
                      <Video className="size-4" />
                      <span>Video Call</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-4" />
                      <span>{booking.location}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  {/* Join meeting */}
                  {booking.status === "ACCEPTED" &&
                    booking.meetingType === "VIDEO" &&
                    booking.meetingLink && (
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() =>
                          window.open(booking.meetingLink, "_blank")
                        }
                      >
                        <Video className="size-4 mr-1" />
                        Join Meeting
                      </Button>
                    )}

                  {/* Leave review */}
                  {booking.status === "COMPLETED" && !booking.review && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      onClick={() => setReviewBooking(booking)}
                    >
                      ⭐ Leave a Review
                    </Button>
                  )}

                  {/* Already reviewed */}
                  {booking.status === "COMPLETED" && booking.review && (
                    <p className="text-sm text-green-600 font-medium">
                       Review submitted
                    </p>
                  )}

                  {/* Already reviewed */}
                  {booking.status === "COMPLETED" &&
                    reviewedIds.has(booking.id) && (
                      <p className="text-sm text-green-600 font-medium">
                        Review submitted
                      </p>
                    )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── REVIEWS ── */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5 text-yellow-400" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 bg-gray-50 rounded-lg space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-4 ${
                          star <= review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {review.reviewer?.name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── REVIEW MODAL ── */}
      <Dialog
        open={!!reviewBooking}
        onOpenChange={() => setReviewBooking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review your session</DialogTitle>
            <DialogDescription>
              How was your consultation with {profileUser.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-3xl transition-colors ${
                    star <= (reviewHover || reviewRating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  onMouseEnter={() => setReviewHover(star)}
                  onMouseLeave={() => setReviewHover(0)}
                  onClick={() => setReviewRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Share your experience (optional)..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewBooking(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewRating === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
