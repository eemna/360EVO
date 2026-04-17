import { useState, useEffect  } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import TagInputSection from "../components/ui/TagInputSection";
import api from "../../services/axios";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function CreateProgramPage() {
  const { id } = useParams();
   const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "INCUBATION",
    status: "DRAFT",
    startDate: "",
    endDate: "",
    applicationDeadline: "",
    capacity: "20",
    coverImage: "",
  });

  const [benefits, setBenefits] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
useEffect(() => {
    if (!id) return;
    api.get(`/programs/${id}`)
      .then(({ data }) => {
        setForm({
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          startDate: data.startDate.split("T")[0],
          endDate: data.endDate.split("T")[0],
          applicationDeadline: data.applicationDeadline.split("T")[0],
          capacity: String(data.capacity),
          coverImage: data.coverImage ?? "",
        });
        setBenefits(data.benefits ?? []);
        setRequirements(data.requirements ?? []);
      })
      .catch(() => {
        showToast({ type: "error", title: "Failed to load program", message: "" });
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [id , navigate,showToast]);
  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

const handleSubmit = async () => {
    if (!form.title || !form.description || !form.startDate || !form.endDate || !form.applicationDeadline) {
      showToast({ type: "error", title: "Please fill in all required fields", message: "" });
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...form, capacity: Number(form.capacity), benefits, requirements };

      if (isEdit) {
        await api.put(`/programs/${id}`, payload);
        showToast({ type: "success", title: "Program updated!", message: "" });
        navigate(`/app/programs/${id}`);
      } else {
        await api.post("/programs", payload);
        showToast({ type: "success", title: "Program created!", message: "" });
        navigate("/app/admin");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? `Failed to ${isEdit ? "update" : "create"} program`;
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };
    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 -ml-2 text-gray-500">
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <BookOpen className="size-5 text-indigo-600" />
        </div>
        <div>
                <h1 className="text-2xl font-semibold text-gray-900">
        {isEdit ? "Edit Program" : "Create Program"}
      </h1>
          <p className="text-gray-500 text-sm">Set up a new incubation, acceleration, or mentorship program</p>
        </div>
      </div>

      <Card className="border border-gray-200">
        <CardHeader><CardTitle className="text-base">Program Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g., Spring 2025 Accelerator" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description <span className="text-red-500">*</span></Label>
            <Textarea placeholder="Describe the program, its goals, and what participants will gain..." value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCUBATION">Incubation</SelectItem>
                  <SelectItem value="ACCELERATION">Acceleration</SelectItem>
                  <SelectItem value="MENTORSHIP">Mentorship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open (accept applications)</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Application Deadline <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.applicationDeadline} onChange={(e) => set("applicationDeadline", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capacity (max participants)</Label>
            <Input type="number" min="1" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className="w-32" />
          </div>

          <div className="space-y-2">
            <Label>Cover Image URL <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Input placeholder="https://..." value={form.coverImage} onChange={(e) => set("coverImage", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader><CardTitle className="text-base">Benefits & Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <TagInputSection
            label="Benefits"
            items={benefits}
            newValue={newBenefit}
            setNewValue={setNewBenefit}
            onAdd={() => {
              if (newBenefit.trim()) {
                setBenefits((prev) => [...prev, newBenefit.trim()]);
                setNewBenefit("");
              }
            }}
            onRemove={(item) => setBenefits((prev) => prev.filter((b) => b !== item))}
            emptyMessage="No benefits added yet"
            variant="green"
          />
          <TagInputSection
            label="Requirements"
            items={requirements}
            newValue={newRequirement}
            setNewValue={setNewRequirement}
            onAdd={() => {
              if (newRequirement.trim()) {
                setRequirements((prev) => [...prev, newRequirement.trim()]);
                setNewRequirement("");
              }
            }}
            onRemove={(item) => setRequirements((prev) => prev.filter((r) => r !== item))}
            emptyMessage="No requirements added yet"
            variant="orange"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
      <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
        {submitting ? <LoadingSpinner size="sm" /> : <BookOpen className="size-4" />}
        {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Program"}
      </Button>
      </div>
    </div>
  );
}