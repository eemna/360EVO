import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Loader2 } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  requireTextConfirmation?: string;
  requireTextLabel?: string;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  requireTextConfirmation,
  requireTextLabel,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTypedValue("");
      setLoading(false);
    }
  }, [open]);

  const isTextMatchRequired = !!requireTextConfirmation;
  const textMatches =
    !isTextMatchRequired || typedValue.trim() === requireTextConfirmation;

  const handleConfirm = async () => {
    if (!textMatches) return;
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={destructive ? "text-red-600" : ""}>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isTextMatchRequired && (
          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-medium text-gray-600">
              {requireTextLabel ??
                `Type "${requireTextConfirmation}" to confirm`}
            </label>
            <Input
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTextConfirmation}
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={loading || !textMatches}
            className={
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
