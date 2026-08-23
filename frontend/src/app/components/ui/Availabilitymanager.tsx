import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Loader2,
  Plus,
  Trash2,
  CalendarOff,
  CalendarCheck,
  Clock,
  CalendarRange,
} from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import api from "../../../services/axios";

type Override = {
  id: string;
  date: string; // ISO date
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
};

export default function AvailabilityManager() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [minNoticeHours, setMinNoticeHours] = useState(0);
  const [horizonEnabled, setHorizonEnabled] = useState(false);
  const [bookingHorizonDays, setBookingHorizonDays] = useState(30);

  const [overrides, setOverrides] = useState<Override[]>([]);
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideType, setOverrideType] = useState<"unavailable" | "custom">(
    "unavailable",
  );
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [addingOverride, setAddingOverride] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: profile }, { data: overridesData }] = await Promise.all([
        api.get("/auth/me"),
        api.get("/experts/availability-overrides"),
      ]);
      setMinNoticeHours(profile?.profile?.minNoticeHours ?? 0);
      const horizon = profile?.profile?.bookingHorizonDays;
      setHorizonEnabled(horizon != null);
      setBookingHorizonDays(horizon ?? 30);
      setOverrides(overridesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put("/experts/availability-settings", {
        minNoticeHours: Number(minNoticeHours),
        bookingHorizonDays: horizonEnabled ? Number(bookingHorizonDays) : null,
      });
      showToast({
        type: "success",
        title: "Settings saved",
        message: "Your booking rules have been updated.",
      });
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Failed to save",
        message: "Something went wrong.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const addOverride = async () => {
    if (!overrideDate) return;
    setAddingOverride(true);
    try {
      const { data } = await api.post("/experts/availability-overrides", {
        date: overrideDate,
        isAvailable: overrideType === "custom",
        startTime: overrideType === "custom" ? overrideStart : null,
        endTime: overrideType === "custom" ? overrideEnd : null,
      });
      setOverrides((prev) => {
        const withoutSameDate = prev.filter(
          (o) => o.date.slice(0, 10) !== data.date.slice(0, 10),
        );
        return [...withoutSameDate, data].sort((a, b) =>
          a.date.localeCompare(b.date),
        );
      });
      setOverrideDate("");
      showToast({
        type: "success",
        title: "Override added",
        message: "This date's availability has been updated.",
      });
    } catch (err) {
      console.error(err);
      showToast({
        type: "error",
        title: "Failed to add override",
        message: "Something went wrong.",
      });
    } finally {
      setAddingOverride(false);
    }
  };

  const removeOverride = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/experts/availability-overrides/${id}`);
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">
        <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingOverrides = overrides.filter(
    (o) => o.date.slice(0, 10) >= today,
  );
  const pastOverrides = overrides.filter((o) => o.date.slice(0, 10) < today);

  return (
    <div className="space-y-5">
      {/* ── Booking rules ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-primary" />
            Booking Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Minimum notice</Label>
            <p className="text-xs text-gray-500">
              Invitees can't book a slot that starts sooner than this.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={minNoticeHours}
                onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                className="w-28"
              />
              <span className="text-sm text-gray-600">hours' notice</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Label>Booking horizon</Label>
              <Select
                value={horizonEnabled ? "limited" : "indefinite"}
                onValueChange={(v) => setHorizonEnabled(v === "limited")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinite">Indefinitely</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              How far in the future invitees are allowed to book.
            </p>
            {horizonEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={bookingHorizonDays}
                  onChange={(e) =>
                    setBookingHorizonDays(Number(e.target.value))
                  }
                  className="w-28"
                />
                <span className="text-sm text-gray-600">days out</span>
              </div>
            )}
          </div>

          <Button
            onClick={saveSettings}
            disabled={savingSettings}
            className="bg-primary hover:bg-primary/90"
          >
            {savingSettings ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save rules"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Date-specific overrides ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="size-4 text-purple-600" />
            Date Overrides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-gray-500">
            Override your regular weekly schedule for a specific date — mark a
            holiday as unavailable, or open extra hours on a day you're normally
            off.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  min={today}
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select
                  value={overrideType}
                  onValueChange={(v) =>
                    setOverrideType(v as "unavailable" | "custom")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unavailable">
                      Mark unavailable
                    </SelectItem>
                    <SelectItem value="custom">Custom hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {overrideType === "custom" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Hours</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="time"
                      value={overrideStart}
                      onChange={(e) => setOverrideStart(e.target.value)}
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <Input
                      type="time"
                      value={overrideEnd}
                      onChange={(e) => setOverrideEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={addOverride}
              disabled={!overrideDate || addingOverride}
              className="gap-1.5 bg-primary hover:bg-primary/90"
            >
              {addingOverride ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {upcomingOverrides.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No upcoming overrides
              </p>
            ) : (
              upcomingOverrides.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2.5">
                    {o.isAvailable ? (
                      <CalendarCheck className="size-4 text-green-600" />
                    ) : (
                      <CalendarOff className="size-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(o.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {o.isAvailable ? (
                        <p className="text-xs text-gray-500">
                          {o.startTime} – {o.endTime}
                        </p>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-[10px] mt-0.5">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={deletingId === o.id}
                    onClick={() => removeOverride(o.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    {deletingId === o.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {pastOverrides.length > 0 && (
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                {pastOverrides.length} past override
                {pastOverrides.length > 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-1.5 opacity-60">
                {pastOverrides.map((o) => (
                  <div key={o.id} className="text-xs px-3 py-1.5">
                    {new Date(o.date).toLocaleDateString()} —{" "}
                    {o.isAvailable
                      ? `${o.startTime}–${o.endTime}`
                      : "Unavailable"}
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
