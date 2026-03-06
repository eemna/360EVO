import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Briefcase, Calendar } from "lucide-react";
import api from "../../services/axios";
import type { User } from "../../context/AuthContext";

interface ExpertProfileProps {
  profileUser: User;
}

export default function ExpertProfile({ profileUser }: ExpertProfileProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [showBookingCalendar] = useState(false);

  if (!profileUser.profile) return null;

  const profile = profileUser.profile;

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const isDateAvailable = (date: Date) => {
    const dayNumber = date.getDay();
    return profile?.weeklyAvailability?.some(
      (slot) => slot.day === dayNumber && slot.enabled,
    );
  };

  const generateSlots = (date: Date) => {
    const dayNumber = date.getDay();

    const availability = profile?.weeklyAvailability?.find(
      (slot) => slot.day === dayNumber && slot.enabled,
    );

    if (!availability || !availability.startTime || !availability.endTime)
      return [];

    const slots: string[] = [];
    const start = Number(availability.startTime.split(":")[0]);
    const end = Number(availability.endTime.split(":")[0]);

    for (let hour = start; hour < end; hour++) {
      slots.push(`${hour}:00`);
    }

    return slots;
  };

  return (
    <div className="space-y-6">
      {/* PROFESSIONAL INFO */}
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
                {profile.yearsOfExperience}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Industries</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.industries?.map((ind: string) => (
                  <Badge key={ind} variant="secondary">
                    {ind}
                  </Badge>
                ))}
              </div>
            </Card>
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

      {/* WEEKLY AVAILABILITY */}
      <Card className="shadow-sm">
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
                {(profile.weeklyAvailability ?? []).map((slot) => {
                  const isAvailable = slot.enabled;

                  return (
                    <TableRow
                      key={slot.id}
                      className={!isAvailable ? "bg-gray-50" : ""}
                    >
                      <TableCell className="font-medium">
                        {dayNames[slot.day]}
                      </TableCell>

                      <TableCell>
                        {isAvailable ? slot.startTime : "—"}
                      </TableCell>

                      <TableCell>{isAvailable ? slot.endTime : "—"}</TableCell>

                      <TableCell>
                        {isAvailable ? (
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* BOOKING CALENDAR */}
      {showBookingCalendar && (
        <Card>
          <CardHeader>
            <CardTitle>Availability Calendar</CardTitle>
          </CardHeader>

          <CardContent className="flex gap-6">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              disabled={(date) => !isDateAvailable(date)}
            />

            <div className="flex-1">
              {selectedDate ? (
                <>
                  <p className="mb-3">
                    Available slots for {format(selectedDate, "EEEE, MMM d")}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {generateSlots(selectedDate).map((slot) => (
                      <Button
                        key={slot}
                        size="sm"
                        variant={
                          selectedSlot === slot ? "secondary" : "outline"
                        }
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>

                  {selectedSlot && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => setBookingOpen(true)}
                    >
                      Confirm Booking
                    </Button>
                  )}
                </>
              ) : (
                <p>Select a date</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BOOKING MODAL */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              {selectedDate &&
                `Booking on ${format(selectedDate, "PPP")} at ${selectedSlot}`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={async () => {
                await api.post("/bookings", {
                  expertId: profileUser.id,
                  date: selectedDate,
                  timeSlot: selectedSlot,
                });

                setBookingOpen(false);
                alert("Booking confirmed!");
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
