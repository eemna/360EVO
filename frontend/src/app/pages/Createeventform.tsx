import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/axios";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Users,
  Image,
  Clock,
  FileText,
  Tag,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../../context/ToastContext";

interface FormData {
  title: string;
  description: string;
  type: string;
  date: string;
  endDate: string;
  location: string;
  virtualLink: string;
  capacity: string;
  coverImage: string;
}

const INITIAL: FormData = {
  title: "",
  description: "",
  type: "",
  date: "",
  endDate: "",
  location: "",
  virtualLink: "",
  capacity: "",
  coverImage: "",
};

function Field({
  label,
  icon,
  required,
  children,
  hint,
  error,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon && <span className="text-blue-500">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CreateEventForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { id } = useParams();
  const isEditing = !!id;
  const isExpert = user?.role === "EXPERT";

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isExpert) {
      setForm((prev) => ({ ...prev, type: "WORKSHOP" }));
    }
  }, [isExpert]);
  useEffect(() => {
    if (!id) return;
    api
      .get(`/events/${id}`)
      .then(({ data }) => {
        setForm({
          title: data.title,
          description: data.description,
          type: data.type,
          date: data.date.slice(0, 16),
          endDate: data.endDate?.slice(0, 16) ?? "",
          location: data.location ?? "",
          virtualLink: data.virtualLink ?? "",
          capacity: data.capacity ? String(data.capacity) : "",
          coverImage: data.coverImage ?? "",
        });
      })
      .catch(() => {
        showToast({
          type: "error",
          title: "Failed to load event",
          message: "",
        });
        navigate("/app/events");
      });
  }, [id, navigate, showToast]);
  const set =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setSelect = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.type) e.type = "Event type is required";
    if (!form.date) e.date = "Start date is required";
    if (form.endDate && form.endDate < form.date)
      e.endDate = "End date must be after start date";
    if (
      form.capacity &&
      (isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
    )
      e.capacity = "Capacity must be a positive number";
    if (!form.location.trim() && !form.virtualLink.trim())
      e.location = "Provide a location or virtual link";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        date: new Date(form.date).toISOString(),
        location: form.location.trim() || undefined,
        virtualLink: form.virtualLink.trim() || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        coverImage: form.coverImage.trim() || undefined,
      };
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();

      if (isEditing) {
        await api.put(`/events/${id}`, payload);
        showToast({
          type: "success",
          title: "Event updated!",
          message: "",
        });
        navigate(`/app/events/${id}`);
      } else {
        const { data } = await api.post("/events", payload);
        if (publish) {
          await api.post(`/events/${data.id}/publish`);
        }
        showToast({
          type: "success",
          title: publish ? "Event published!" : "Event saved as draft",
          message: publish
            ? "Your event is now live."
            : "You can publish it later from your events.",
        });
        navigate(`/app/events/${data.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Something went wrong";
      showToast({
        type: "error",
        title: isEditing ? "Failed to update event" : "Failed to create event",
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };
  const typeOptions = isExpert
    ? [{ label: "Workshop", value: "WORKSHOP" }]
    : [
        { label: "Conference", value: "CONFERENCE" },
        { label: "Networking", value: "NETWORKING" },
        { label: "Pitch Day", value: "PITCH_DAY" },
        { label: "Workshop", value: "WORKSHOP" },
      ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/app/events")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditing
            ? "Edit Event"
            : isExpert
              ? "Create Workshop"
              : "Create Event"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isEditing
            ? "Update your event details."
            : isExpert
              ? "Host a workshop and share your expertise with the community."
              : "Organize an event for the 360EVO community."}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Basic Information
          </h2>

          <Field
            label="Title"
            icon={<FileText className="w-4 h-4" />}
            required
            error={errors.title}
          >
            <Input
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. AI Workshop for Founders"
              className="rounded-xl border-gray-200"
            />
          </Field>

          <Field
            label="Description"
            icon={<FileText className="w-4 h-4" />}
            required
            error={errors.description}
          >
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              placeholder="Tell attendees what to expect..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </Field>

          <Field
            label="Event Type"
            icon={<Tag className="w-4 h-4" />}
            required
            error={errors.type}
          >
            <Select
              value={form.type}
              onValueChange={setSelect("type")}
              disabled={isExpert}
            >
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isExpert && (
              <p className="text-xs text-gray-400">
                Experts can only create workshops.
              </p>
            )}
          </Field>
        </div>

        <div className="border-t border-gray-100" />

        {/* Date & Time */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Date & Time
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Start Date & Time"
              icon={<Calendar className="w-4 h-4" />}
              required
              error={errors.date}
            >
              <Input
                type="datetime-local"
                value={form.date}
                onChange={set("date")}
                className="rounded-xl border-gray-200"
              />
            </Field>

            <Field
              label="End Date & Time"
              icon={<Clock className="w-4 h-4" />}
              error={errors.endDate}
              hint="Optional"
            >
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={set("endDate")}
                min={form.date}
                className="rounded-xl border-gray-200"
              />
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Location */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Location
          </h2>
          <p className="text-xs text-gray-400 -mt-2">
            Provide a physical location, a virtual link, or both.
          </p>

          <Field
            label="Physical Location"
            icon={<MapPin className="w-4 h-4" />}
            error={errors.location}
          >
            <Input
              value={form.location}
              onChange={set("location")}
              placeholder="e.g. 123 Main St, San Francisco"
              className="rounded-xl border-gray-200"
            />
          </Field>

          <Field
            label="Virtual Link"
            icon={<Globe className="w-4 h-4" />}
            hint="Zoom, Google Meet, Teams, etc."
          >
            <Input
              value={form.virtualLink}
              onChange={set("virtualLink")}
              placeholder="https://meet.google.com/..."
              className="rounded-xl border-gray-200"
            />
          </Field>
        </div>

        <div className="border-t border-gray-100" />

        {/* Extra */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Extra Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Capacity"
              icon={<Users className="w-4 h-4" />}
              hint="Leave empty for unlimited"
              error={errors.capacity}
            >
              <Input
                type="number"
                min="1"
                value={form.capacity}
                onChange={set("capacity")}
                placeholder="e.g. 100"
                className="rounded-xl border-gray-200"
              />
            </Field>

            <Field
              label="Cover Image URL"
              icon={<Image className="w-4 h-4" />}
              hint="Optional — paste an image URL"
            >
              <Input
                value={form.coverImage}
                onChange={set("coverImage")}
                placeholder="https://..."
                className="rounded-xl border-gray-200"
              />
            </Field>
          </div>

          {/* Cover preview */}
          {form.coverImage && (
            <div className="rounded-xl overflow-hidden h-36 bg-gray-100">
              <img
                src={form.coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pb-8">
        <Button
          variant="outline"
          onClick={() => navigate("/app/events")}
          disabled={submitting}
        >
          Cancel
        </Button>

        <div className="flex gap-3">
          {isEditing ? (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? "Publishing..." : "Publish Now"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
