import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { AxiosError } from "axios";
import {
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  Video,
  MapPin,
  CheckCircle2,
  User as UserIcon,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../components/ui/utils";
import api from "../../services/axios";
import type { User, WeeklyAvailability } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import AvailabilityCalendar from "../components/ui/Availabilitycalendar";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function BookConsultationPage() {
  const [duration, setDuration] = useState(30);

  const { showToast } = useToast();
  const [booking, setBooking] = useState(false);
  const { expertId } = useParams();
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null); // ISO complet
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);

  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [meetingType, setMeetingType] = useState<"VIDEO" | "IN_PERSON">(
    "VIDEO",
  );
  const [location, setLocation] = useState("");
  const [expert, setExpert] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const price = expert?.profile?.hourlyRate
    ? (Number(expert.profile.hourlyRate) * duration) / 60
    : 0;

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const { data } = await api.get(`/experts/${expertId}`);
        setExpert(data);
      } catch (error) {
        console.error(error);
        showToast({
          type: "error",
          title: "Failed to load expert",
          message: "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (expertId) fetchExpert();
  }, [expertId, showToast]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot || dayOfWeek === null || !expert) {
      showToast({
        type: "warning",
        title: "Missing information",
        message: "Please select a date and time first.",
      });
      return;
    }
    try {
      if (meetingType === "IN_PERSON" && !location.trim()) {
        showToast({
          type: "error",
          title: "Location required",
          message: "Please enter meeting location",
        });
        return;
      }

      setBooking(true);
      const startDateTime = new Date(selectedSlot);
      const tzOffset = startDateTime.getTimezoneOffset();

      await api.post("/consultations/request", {
        expertId: expert.id,
        date: selectedSlot.slice(0, 10), // "YYYY-MM-DD"
        timeSlot: selectedSlot.slice(11, 16), // "HH:mm"
        startDateTimeISO: selectedSlot,
        duration,
        message,
        topic,
        meetingType,
        location: meetingType === "IN_PERSON" ? location : null,
        tzOffset,
        dayOfWeek,
      });

      setSelectedSlot(null);
      setDayOfWeek(null);
      setTopic("");
      setMessage("");
      setLocation("");

      showToast({
        type: "success",
        title: "Booking Request Sent!",
        message:
          "The expert will review your request. You'll be notified to complete payment once accepted.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? (error.response?.data?.message ??
            "Something went wrong. Please try again.")
          : "Something went wrong. Please try again.";
      showToast({
        type: "error",
        title: "Booking Failed",
        message: errorMessage,
      });
      console.error(
        "Booking error:",
        error instanceof AxiosError ? error.response?.data : error,
      );
    } finally {
      setBooking(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!expert || !expert.profile) return <div>Expert not found</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-semibold text-foreground">
          Book a Consultation
        </h1>
        <p className="text-gray-600 mt-1">
          Schedule a session with {expert.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="size-24 mb-4">
                  <AvatarImage src={expert.profile.avatar ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
                    {getInitials(expert.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg text-foreground">
                  {expert.name}
                </h3>
                <Badge className="bg-green-100 text-green-700 mt-2">
                  Expert
                </Badge>

                <div className="w-full mt-6 pt-6 border-t border-gray-300">
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                    <DollarSign className="size-4" />
                    <span className="text-sm">Hourly Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    ${expert.profile.hourlyRate ?? 0}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">per hour</p>
                </div>

                <div className="w-full mt-6 pt-6 border-t border-gray-300 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon className="size-4" />
                    <span>Expertise Areas</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {expert.profile.expertise.map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="bg-primary/10 border-primary/20 text-primary text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Typical Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expert.profile.weeklyAvailability?.map(
                  (slot: WeeklyAvailability) => (
                    <div
                      key={slot.day}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg text-sm",
                        slot.enabled ? "bg-green-50" : "bg-gray-50",
                      )}
                    >
                      <span
                        className={cn(
                          "font-medium",
                          slot.enabled ? "text-foreground" : "text-gray-400",
                        )}
                      >
                        {dayNames[slot.day]}
                      </span>
                      {slot.enabled ? (
                        <span className="text-gray-600 text-xs">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Unavailable
                        </span>
                      )}
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Date & Time */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold">
                  1
                </div>
                <CardTitle>Select a Date & Time</CardTitle>
              </div>
              <div className="flex gap-3 mt-4">
                {[30, 60, 90].map((d) => (
                  <Button
                    key={d}
                    variant={duration === d ? "secondary" : "outline"}
                    onClick={() => {
                      setDuration(d);
                      setSelectedSlot(null);
                      setDayOfWeek(null);
                    }}
                  >
                    {d} min
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <AvailabilityCalendar
                expertId={expertId!}
                durationMinutes={duration}
                selectedSlot={selectedSlot}
                onSelectSlot={(iso: string, dow: number) => {
                  setSelectedSlot(iso);
                  setDayOfWeek(dow);
                }}
              />
            </CardContent>
          </Card>

          {/* Step 2: Confirm */}
          {selectedSlot && (
            <Card className="shadow-md border-2 border-primary/20 bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold">
                    2
                  </div>
                  <CardTitle>Confirm Your Booking</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="size-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-semibold text-foreground">
                        {format(
                          new Date(selectedSlot),
                          "EEEE, MMMM d, yyyy 'at' HH:mm",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-foreground">
                        {duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="size-5 text-primary" />
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="font-semibold text-foreground">${price}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={
                        meetingType === "VIDEO" ? "secondary" : "outline"
                      }
                      onClick={() => {
                        setMeetingType("VIDEO");
                        setLocation("");
                      }}
                    >
                      <Video className="size-4 mr-2" />
                      Video Call
                    </Button>

                    <Button
                      type="button"
                      variant={
                        meetingType === "IN_PERSON" ? "secondary" : "outline"
                      }
                      onClick={() => setMeetingType("IN_PERSON")}
                    >
                      <MapPin className="size-4 mr-2" />
                      In Person
                    </Button>
                  </div>
                </div>

                {meetingType === "IN_PERSON" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Meeting Location *</Label>
                    <Textarea
                      id="location"
                      placeholder="Enter meeting address or place"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Textarea
                    id="topic"
                    placeholder="What is this consultation about?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Anything else the expert should know?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 min-w-[160px]"
                  onClick={handleConfirmBooking}
                  disabled={booking || !topic.trim()}
                >
                  {booking ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
