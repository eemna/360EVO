import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import api from "../../../services/axios";

type DayAvailability = {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "09:00"
  endTime: string; // "17:00"
};

interface AvailabilityCalendarProps {
  expertId: string;
  durationMinutes: number;
  onSelectSlot: (startDateTimeISO: string, dayOfWeek: number) => void;
  selectedSlot?: string | null;
}

export default function AvailabilityCalendar({
  expertId,
  durationMinutes,
  onSelectSlot,
  selectedSlot,
}: AvailabilityCalendarProps) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthKey = `${monthCursor.getFullYear()}-${String(monthCursor.getMonth() + 1).padStart(2, "0")}`;

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setSelectedDate(null);
    try {
      const { data } = await api.get(`/experts/${expertId}/availability`, {
        params: { month: monthKey },
      });
      setDays(data);
    } catch (err) {
      console.error(err);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [expertId, monthKey]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const availableDateSet = useMemo(
    () => new Set(days.map((d) => d.date)),
    [days],
  );
  const dayLookup = useMemo(() => {
    const map: Record<string, DayAvailability> = {};
    days.forEach((d) => (map[d.date] = d));
    return map;
  }, [days]);

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (string | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push(iso);
    }
    return cells;
  }, [monthCursor]);

  const timeSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const day = dayLookup[selectedDate];
    if (!day) return [];

    const [startH, startM] = day.startTime.split(":").map(Number);
    const [endH, endM] = day.endTime.split(":").map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    const slots: string[] = [];
    for (let mins = startMins; mins + durationMinutes <= endMins; mins += 30) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    return slots;
  }, [selectedDate, dayLookup, durationMinutes]);

  const monthLabel = monthCursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const isCurrentOrFutureMonth = () => {
    const now = new Date();
    return (
      monthCursor.getFullYear() > now.getFullYear() ||
      (monthCursor.getFullYear() === now.getFullYear() &&
        monthCursor.getMonth() >= now.getMonth())
    );
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          Pick a time
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              setMonthCursor(
                (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium w-32 text-center">
            {monthLabel}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              setMonthCursor(
                (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ── Day picker ── */}
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-medium text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((iso, i) => {
                  if (!iso) return <div key={i} />;
                  const isAvailable = availableDateSet.has(iso);
                  const isSelected = selectedDate === iso;
                  const dayNum = Number(iso.slice(-2));
                  return (
                    <button
                      key={iso}
                      disabled={!isAvailable}
                      onClick={() => setSelectedDate(iso)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-white"
                          : isAvailable
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
              {!isCurrentOrFutureMonth() && (
                <p className="text-xs text-gray-400 mt-2">
                  Showing a past month
                </p>
              )}
              {availableDateSet.size === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  No availability this month
                </p>
              )}
            </div>

            {/* ── Time slots for selected day ── */}
            <div>
              {!selectedDate ? (
                <p className="text-sm text-gray-400 text-center py-12">
                  Select a date to see available times
                </p>
              ) : timeSlotsForSelectedDate.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">
                  No slots long enough for a {durationMinutes}-minute session
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {timeSlotsForSelectedDate.map((time) => {
                    const iso = `${selectedDate}T${time}:00`;
                    const isSelected = selectedSlot === iso;
                    return (
                      <button
                        key={time}
                        onClick={() => {
                          const dayOfWeek = new Date(
                            `${selectedDate}T00:00:00`,
                          ).getDay();
                          onSelectSlot(iso, dayOfWeek);
                        }}
                        className={`px-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "border-gray-200 text-gray-700 hover:border-primary/30 hover:bg-primary/10"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
