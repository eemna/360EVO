import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useNavigate } from "react-router";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  User,
  Building,
  MessageSquare,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  Video,
  // MapPin,
} from "lucide-react";
import { useEffect } from "react";
import api from "../../services/axios";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";

interface Booking {
  id: string;
  startDateTime: string;
  endDateTime: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "DECLINED"
    | "COMPLETED"
    | "CANCELLED"
    | "PENDING_PAYMENT";
  expertId: string;
  expert?: { id: string; name: string };
  duration: number;
  price: number;
  topic: string;
  description?: string;

  meetingType?: "VIDEO" | "IN_PERSON";
  meetingLink?: string;
  location?: string;

  founderName?: string;

  member: {
    id: string;
    name: string;
  };
  review?: { id: string } | null;
}

export function ManageReservations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      setProcessingAction("complete");
      await api.put(`/consultations/${bookingId}/complete`);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "COMPLETED" } : b,
        ),
      );
      showToast({ type: "success", title: "Session marked complete!" });
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking || reviewRating === 0) return;
    try {
      await api.post(`/consultations/${reviewBooking.id}/review`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      showToast({ type: "success", title: "Review submitted ⭐" });
      setReviewBooking(null);
      setReviewRating(0);
      setReviewComment("");
    } catch (error) {
      console.error(error);
    }
  };
  const [processingAction, setProcessingAction] = useState<
    "accept" | "reject" | "cancel" | "complete" | null
  >(null);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    api
      .get("/consultations")
      .then(({ data }) => {
        if (!cancelled) setBookings(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);
  const pendingBookings = bookings.filter((b) => b.status === "PENDING");

  const confirmedBookings = bookings.filter((b) => b.status === "ACCEPTED");

  const awaitingPaymentBookings = bookings.filter(
    (b) => b.status === "PENDING_PAYMENT",
  );

  const scheduleData = confirmedBookings.map((b) => ({
    date: b.startDateTime,
    time: format(new Date(b.startDateTime), "HH:mm"),
    duration: b.duration,
    client: b.member?.name || "Client",
    topic: b.topic || "Consultation",
    status: "confirmed",
  }));

  const [activeTab, setActiveTab] = useState("pending");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      setProcessingAction("accept");
      const { data } = await api.put(`/consultations/${bookingId}/accept`);

      setBookings((prev) => prev.map((b) => (b.id === bookingId ? data : b)));

      showToast({
        type: "success",
        title: "Booking Accepted",
        message: "The session has been confirmed.",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };
  const handleRejectBooking = async () => {
    if (!selectedBooking) return;

    try {
      setProcessingId(selectedBooking.id);
      setProcessingAction("reject");
      await api.put(`/consultations/${selectedBooking.id}/reject`, {
        reason: rejectionReason,
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: "DECLINED" } : b,
        ),
      );

      showToast({
        type: "success",
        title: "Booking Rejected",
        message: "The client has been notified.",
      });

      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedBooking(null);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleCancelReservation = async () => {
    if (!selectedBooking || !cancellationReason.trim()) return;

    try {
      await api.put(`/consultations/${selectedBooking.id}/cancel`, {
        reason: cancellationReason,
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: "CANCELLED" } : b,
        ),
      );

      showToast({
        type: "success",
        title: "Reservation Cancelled",
        message: "The session has been cancelled.",
      });

      setCancelDialogOpen(false);
      setCancellationReason("");
      setSelectedBooking(null);
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "available":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Booking cards skeleton */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="size-4 mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            Manage Reservations
          </h1>
          <p className="text-gray-600">
            Review pending requests, manage your schedule, and handle your
            consultations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Requests
                  </p>
                  <p className="text-3xl font-semibold text-orange-600 mt-1">
                    {pendingBookings.length}
                  </p>
                </div>
                <div className="size-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="size-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Confirmed Sessions
                  </p>
                  <p className="text-3xl font-semibold text-green-600 mt-1">
                    {confirmedBookings.length}
                  </p>
                </div>
                <div className="size-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Confirmed Earnings
                  </p>
                  <p className="text-3xl font-semibold text-indigo-600 mt-1">
                    $
                    {confirmedBookings
                      .reduce(
                        (total, booking) => total + Number(booking.price),
                        0,
                      )
                      .toLocaleString()}
                  </p>
                </div>
                <div className="size-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <DollarSign className="size-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full gap-2 mb-6 overflow-x-auto px-1 justify-start">
            <TabsTrigger
              value="pending"
              className="flex-shrink-0 whitespace-nowrap rounded-lg border bg-white data-[state=active]:bg-gray-100 px-4"
            >
              Pending Requests
              {pendingBookings.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="awaiting"
              className="flex-shrink-0 whitespace-nowrap rounded-lg border bg-white data-[state=active]:bg-gray-100 px-4"
            >
              {" "}
              Awaiting Payment
              {awaitingPaymentBookings.length > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-white">
                  {awaitingPaymentBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="confirmed"
              className="flex-shrink-0 whitespace-nowrap rounded-lg border bg-white data-[state=active]:bg-gray-100 px-4"
            >
              Confirmed Sessions
            </TabsTrigger>

            <TabsTrigger
              value="schedule"
              className="flex-shrink-0 whitespace-nowrap rounded-lg border bg-white data-[state=active]:bg-gray-100 px-4"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex-shrink-0 whitespace-nowrap rounded-lg border bg-white data-[state=active]:bg-gray-100 px-4"
            >
              Completed
              {completedBookings.length > 0 && (
                <Badge className="ml-2 bg-gray-500 text-white">
                  {completedBookings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent
            value="pending"
            className="space-y-6 max-h-[70vh] overflow-y-auto pr-2"
          >
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="size-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg">No pending requests</p>
                  <p className="text-gray-500 text-sm mt-1">
                    You're all caught up! New booking requests will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="border-l-4 border-l-orange-500"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {booking.member?.name || "Member"}
                          </CardTitle>
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300 border">
                            Pending Review
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <User className="size-4" />
                            <span>{booking.founderName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            <span>{formatDate(booking.startDateTime)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            <span>
                              {format(new Date(booking.startDateTime), "HH:mm")}{" "}
                              ({booking.duration} min)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="size-4" />
                            <span>({booking.price})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Topic: {booking.topic}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {booking.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      {/* Meeting Type */}
                      <div className="flex items-center gap-2">
                        {booking.meetingType === "VIDEO" ? (
                          <>
                            <Video className="size-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Video Call
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPin className="size-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              In Person - {booking.location}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Join Button */}
                      {booking.meetingType === "VIDEO" &&
                        booking.meetingLink && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() =>
                              window.open(booking.meetingLink, "_blank")
                            }
                          >
                            <Video className="size-4 mr-1" />
                            Join
                          </Button>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4 ">
                      <Button
                        onClick={() => handleAcceptBooking(booking.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processingId === booking.id &&
                        processingAction === "accept" ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <CheckCircle2 className="size-4 mr-2" />
                        )}
                        Accept Booking
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setRejectDialogOpen(true);
                        }}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {processingId === booking.id &&
                        processingAction === "reject" ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <XCircle className="size-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="awaiting" className="space-y-6">
            {awaitingPaymentBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 text-lg">
                    No sessions awaiting payment
                  </p>
                </CardContent>
              </Card>
            ) : (
              awaitingPaymentBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="border-l-4 border-l-yellow-400"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">
                        {booking.member?.name}
                      </CardTitle>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 border">
                        Awaiting Payment
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        <span>{formatDate(booking.startDateTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        <span>
                          {format(new Date(booking.startDateTime), "HH:mm")} (
                          {booking.duration} min)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="size-4" />
                        <span>{booking.price}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Waiting for the client to complete payment.
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          {/* Confirmed Sessions Tab */}
          <TabsContent value="confirmed" className="space-y-6">
            {confirmedBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="size-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg">No confirmed sessions</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Accept pending requests to see them here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              confirmedBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="border-l-4 border-l-green-500"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {booking.member.name}
                          </CardTitle>
                          <Badge className="bg-green-100 text-green-700 border-green-300 border">
                            <CheckCircle2 className="size-3 mr-1" />
                            Confirmed
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <User className="size-4" />
                            <span>{booking.founderName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            <span>{formatDate(booking.startDateTime)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            <span>
                              {format(new Date(booking.startDateTime), "HH:mm")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="size-4" />
                            <span>{booking.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Topic: {booking.topic}
                      </p>
                    </div>

                    {/* Video Call Box */}

                    {booking.meetingType === "VIDEO" && booking.meetingLink && (
                      <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <Video className="size-5 text-blue-600 mt-1" />

                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-700">
                            Video Call
                          </p>

                          <a
                            href={booking.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {booking.meetingLink}
                          </a>
                        </div>
                      </div>
                    )}
                    {booking.meetingType === "IN_PERSON" &&
                      booking.location && (
                        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                          <MapPin className="size-5 text-amber-600 mt-1" />

                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-gray-700">
                              In-Person Meeting
                            </p>

                            <p className="text-sm text-gray-600">
                              {booking.location}
                            </p>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location || "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-orange-500 hover:underline"
                            >
                              Open in Maps
                            </a>
                          </div>
                        </div>
                      )}

                    <div className="flex items-center gap-3 pt-1">
                      {booking.meetingType === "VIDEO" &&
                        booking.meetingLink && (
                          <Button
                            onClick={() =>
                              window.open(booking.meetingLink, "_blank")
                            }
                            className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-medium"
                          >
                            <Video className="size-4 mr-2" />
                            Join Meeting
                          </Button>
                        )}

                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setCancelDialogOpen(true);
                        }}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>

                      {user?.id === booking.expertId &&
                        booking.status === "ACCEPTED" && (
                          <Button
                            onClick={() => handleCompleteBooking(booking.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={processingId === booking.id}
                          >
                            {processingId === booking.id ? (
                              <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                              <CheckCircle2 className="size-4 mr-2" />
                            )}
                            Mark Complete
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="completed" className="space-y-6">
            {completedBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 text-lg">
                    No completed sessions yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedBookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-gray-400">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">
                        {booking.member?.name}
                      </CardTitle>
                      <Badge className="bg-gray-100 text-gray-700 border">
                        Completed
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        <span>{formatDate(booking.startDateTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        <span>
                          {format(new Date(booking.startDateTime), "HH:mm")} (
                          {booking.duration} min)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="size-4" />
                        <span>{booking.price}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Topic: {booking.topic}
                    </p>
                    {user?.id === booking.member?.id && !booking.review && (
                      <Button
                        variant="outline"
                        onClick={() => setReviewBooking(booking)}
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      >
                        ⭐ Leave a Review
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  Your Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduleData.map((slot, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        slot.status === "confirmed"
                          ? "bg-green-50 border-green-200"
                          : slot.status === "pending"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-gray-900">
                              {formatDate(slot.date)}
                            </p>
                            <Badge
                              className={`border ${getStatusColor(slot.status)}`}
                            >
                              {slot.status.charAt(0).toUpperCase() +
                                slot.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-4" />
                              <span>
                                {slot.time} ({slot.duration} min)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Building className="size-4" />
                              <span>{slot.client}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="size-4" />
                              <span>{slot.topic}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reject Booking Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="size-5" />
                Reject Booking Request
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this booking. The client
                will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Schedule conflict, outside area of expertise, etc."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setSelectedBooking(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectBooking}
                className="bg-red-600 hover:bg-red-700"
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Reservation Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="size-5" />
                Cancel Reservation
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this session. The client
                will be notified and refunded.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">
                  Reason for Cancellation *
                </Label>
                <Textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g., Emergency, illness, scheduling conflict, etc."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelDialogOpen(false);
                  setCancellationReason("");
                  setSelectedBooking(null);
                }}
              >
                Keep Reservation
              </Button>
              <Button
                onClick={handleCancelReservation}
                className="bg-red-600 hover:bg-red-700"
                disabled={!cancellationReason.trim()}
              >
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!reviewBooking}
          onOpenChange={() => setReviewBooking(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review your session</DialogTitle>
              <DialogDescription>
                How was your consultation with {reviewBooking?.expert?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Star picker */}
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
    </div>
  );
}
