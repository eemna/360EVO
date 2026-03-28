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
import { Calendar } from "../components/ui/calendar";
import { Skeleton } from "../components/ui/skeleton";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
interface Booking {
  id: string;
  expertId: string;
  startDateTime: string;
  endDateTime: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED" | "CANCELLED";
}
export function BookConsultationPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [duration, setDuration] = useState(30);

  const { showToast } = useToast();
  const [booking, setBooking] = useState(false);
  const { expertId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [meetingType, setMeetingType] = useState<"VIDEO" | "IN_PERSON">(
    "VIDEO",
  );
  const [location, setLocation] = useState("");
  const [expert, setExpert] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingBooking, setPendingBooking] = useState<{
    id: string;
    price: number;
  } | null>(null);
  const [paying, setPaying] = useState(false);
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
      } finally {
        setLoading(false);
      }
    };

    if (expertId) fetchExpert();
  }, [expertId]);
  useEffect(() => {
    if (!expertId) return;
    let cancelled = false;

    api
      .get("/consultations")
      .then(({ data }) => {
        if (!cancelled) {
          setBookings(data.filter((b: Booking) => b.expertId === expertId));
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [expertId]);
  // Check if a date is available based on weekly schedule
  const isDateAvailable = (date: Date) => {
    if (!expert?.profile?.weeklyAvailability) return false;

    const dayNumber = date.getDay();

    return expert.profile.weeklyAvailability.some(
      (slot) => slot.day === dayNumber && slot.enabled,
    );
  };

  const generateTimeSlots = (date: Date) => {
    if (!expert?.profile?.weeklyAvailability) return [];

    const dayNumber = date.getDay();

    const availability = expert.profile.weeklyAvailability.find(
      (slot) => slot.day === dayNumber && slot.enabled,
    );

    if (!availability?.startTime || !availability?.endTime) return [];

    const slots: string[] = [];

    const [startHour, startMinute] = availability.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);

    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(date);
    end.setHours(endHour, endMinute, 0, 0);

    const current = new Date(start);

    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Stop if duration exceeds availability window
      if (slotEnd > end) break;

      //  Remove past time
      if (slotStart <= new Date()) {
        current.setMinutes(current.getMinutes() + 30);
        continue;
      }

      //  Check overlap with existing bookings
      const isOverlapping = bookings.some((booking) => {
        const bookingStart = new Date(booking.startDateTime);
        const bookingEnd = new Date(booking.endDateTime);

        return slotStart < bookingEnd && slotEnd > bookingStart;
      });

      if (!isOverlapping) {
        slots.push(slotStart.toTimeString().slice(0, 5));
      }

      current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
  };
  const isDateFullyBooked = (date: Date) => {
    if (!isDateAvailable(date)) return true;

    const slots = generateTimeSlots(date);
    return slots.length === 0;
  };
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot || !expert) return;

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
    const [hour, minute] = selectedSlot.split(":").map(Number);
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(hour, minute, 0, 0);
      // Create booking — starts as PENDING_PAYMENT
      const { data: newBooking } = await api.post("/consultations/request", {
        expertId: expert.id,
        date: selectedDate.toISOString(),
        timeSlot: selectedSlot,
        startDateTimeISO: startDateTime.toISOString(),
        duration,
        message,
        topic,
        meetingType,
        location: meetingType === "IN_PERSON" ? location : null,
      });

      // Refresh bookings so the slot appears taken on the calendar
      const { data: updatedBookings } = await api.get("/consultations");
      setBookings(
        updatedBookings.filter((b: Booking) => b.expertId === expert.id),
      );

      // Clear the form
      setSelectedSlot(null);
      setSelectedDate(undefined);
      setTopic("");
      setMessage("");
      setLocation("");

      // Show the payment modal — this was missing before
      setPendingBooking({ id: newBooking.id, price: newBooking.price });
    } catch (error) {
      showToast({
        type: "error",
        title: "Booking Failed",
        message: "Something went wrong. Please try again.",
      });
      console.error(error);
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
        {/* Left column skeleton */}
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

        {/* Right column skeleton */}
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
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Profile
        </Button>
        <h1 className="text-3xl font-semibold text-gray-900">
          Book a Consultation
        </h1>
        <p className="text-gray-600 mt-1">
          Schedule a session with {expert.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Expert Card */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="size-24 mb-4">
                  <AvatarImage src={expert.profile.avatar ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
                    {getInitials(expert.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg text-gray-900">
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
                  <div className="text-3xl font-bold text-indigo-600">
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
                        className="bg-indigo-50 border-indigo-200 text-indigo-700 text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule Reference */}
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
                          slot.enabled ? "text-gray-900" : "text-gray-400",
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
          {/* Step 1: Select Date */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-semibold">
                  1
                </div>
                <CardTitle>Select a Date</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;

                    setSelectedSlot(null);
                    setSelectedDate(date);
                  }}
                  disabled={(date) =>
                    date < today ||
                    !isDateAvailable(date) ||
                    isDateFullyBooked(date)
                  }
                  className="rounded-lg border border-gray-300 shadow-sm p-4"
                  modifiers={{
                    available: (date) =>
                      date >= today &&
                      isDateAvailable(date) &&
                      !isDateFullyBooked(date),
                  }}
                  modifiersClassNames={{
                    available: "bg-indigo-50 font-semibold",
                  }}
                />
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  <span>
                    Available dates are highlighted. Select a date to view time
                    slots.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Select Time Slot */}
          {selectedDate && (
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-semibold">
                    2
                  </div>
                  <CardTitle>Select a Time Slot</CardTitle>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Available times for{" "}
                  {selectedDate && (
                    <span className="font-semibold">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-6">
                  {[30, 60, 90].map((d) => (
                    <Button
                      key={d}
                      variant={duration === d ? "secondary" : "outline"}
                      onClick={() => {
                        setDuration(d);
                        setSelectedSlot(null);
                      }}
                    >
                      {d} min
                    </Button>
                  ))}
                </div>

                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={
                          selectedSlot === slot ? "secondary" : "outline"
                        }
                        className={cn(
                          "h-auto py-3 flex flex-col items-center",
                          selectedSlot === slot
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "hover:bg-indigo-50 hover:border-indigo-300",
                        )}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <Clock className="size-4 mb-1" />
                        <span className="text-sm font-medium">{slot}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No available time slots for this date
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirm */}
          {selectedDate && selectedSlot && (
            <Card className="shadow-md border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-semibold">
                    3
                  </div>
                  <CardTitle>Confirm Your Booking</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="size-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-semibold text-gray-900">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                        {selectedSlot}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">
                        {duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="size-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="font-semibold text-gray-900">${price}</p>
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
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Let the expert know what you'd like to discuss..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 min-w-[160px]"
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
      {/* Payment Modal */}
      {pendingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="size-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Complete Payment
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Your slot is reserved for 10 minutes
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Consultation fee</span>
                <span className="font-semibold">${pendingBooking.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform fee</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-indigo-600">${pendingBooking.price}</span>
              </div>
            </div>

            {/* Mock card UI */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-400 mb-1">Card number</p>
                <p className="text-sm text-gray-600 font-mono">
                  4242 4242 4242 4242
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Expiry</p>
                  <p className="text-sm text-gray-600 font-mono">12/26</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">CVC</p>
                  <p className="text-sm text-gray-600 font-mono">123</p>
                </div>
              </div>
              <p className="text-xs text-center text-gray-400">
                🔒 Mock payment — no real charge. Replace with Stripe in Sprint
                7.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await api.patch(
                    `/consultations/${pendingBooking.id}/cancel-unpaid`,
                  );
                  setPendingBooking(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
                disabled={paying}
                onClick={async () => {
                  try {
                    setPaying(true);
                    await api.patch(`/consultations/${pendingBooking.id}/pay`);

                    // Now send the auto-message
                    const { data: conversation } = await api.post(
                      "/conversations",
                      {
                        otherUserId: expert.id,
                      },
                    );
                    await api.post(
                      `/conversations/${conversation.id}/messages`,
                      {
                        content: `📅 Booking confirmed & paid — ${format(new Date(), "MMMM d, yyyy")}`,
                      },
                    );

                    const { data: updatedBookings } =
                      await api.get("/consultations");
                    setBookings(
                      updatedBookings.filter(
                        (b: Booking) => b.expertId === expert.id,
                      ),
                    );

                    setPendingBooking(null);
                    showToast({
                      type: "success",
                      title: "Payment Confirmed 🎉",
                      message: "Your booking is now pending expert approval.",
                    });
                  } catch {
                    showToast({
                      type: "error",
                      title: "Payment Failed",
                      message: "Please try again.",
                    });
                  } finally {
                    setPaying(false);
                  }
                }}
              >
                {paying ? (
                  <>
                    <LoadingSpinner size="sm" /> Processing...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
