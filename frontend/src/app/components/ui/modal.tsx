import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";

import type { ReactNode } from "react";

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  children: ReactNode;

  submitText?: string;
  cancelText?: string;

  onSubmit?: (e: React.FormEvent) => void;
}

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitText = "Submit",
  cancelText = "Cancel",
  onSubmit,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          onSubmit={(e) => {
            if (onSubmit) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        >
          <div className="py-4 space-y-4">{children}</div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {cancelText}
            </Button>

            {onSubmit && <Button type="submit">{submitText}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
