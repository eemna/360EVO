import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import { ShieldCheck, FileSearch } from "lucide-react";

interface DdRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

export function DdRequestModal({
  open,
  onOpenChange,
  projectId,
  projectTitle,
}: DdRequestModalProps) {
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [nda, setNda] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await api.post("/dd-requests", { projectId, message, nda });
      showToast({
        type: "success",
        title: "DD Request Sent",
        message: "The startup will be notified and can approve your request.",
      });
      onOpenChange(false);
      setMessage("");
      setNda(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to send request";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileSearch className="size-5 text-indigo-600" />
            </div>
            <DialogTitle className="text-lg">Request Due Diligence Access</DialogTitle>
          </div>
          <DialogDescription>
            Request access to <span className="font-semibold text-gray-700">"{projectTitle}"</span>'s
            private data room. The startup team will review and approve your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <ShieldCheck className="size-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Access is granted for 30 days. All document views are logged. The startup
              reviews your request before granting access.
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="dd-message">
              Introduction Message <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Textarea
              id="dd-message"
              placeholder="Introduce yourself and explain your interest. e.g., 'I'm a seed-stage investor focused on FinTech in MENA. Your traction metrics caught my attention...'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right">{message.length}/500</p>
          </div>

          {/* NDA checkbox */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50">
            <Checkbox
              id="nda"
              checked={nda}
              onCheckedChange={(checked) => setNda(checked as boolean)}
              className="mt-0.5"
            />
            <div>
              <label htmlFor="nda" className="text-sm font-medium text-gray-700 cursor-pointer">
                I agree to a standard NDA
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                I will treat all information in the data room as confidential.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {submitting ? <LoadingSpinner size="sm" /> : <FileSearch className="size-4" />}
            {submitting ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}