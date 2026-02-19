import type { ReactNode } from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  ctaText,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
      <div className="text-muted-foreground">{icon}</div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="text-sm text-muted-foreground max-w-sm">
        {subtitle}
      </p>

      {ctaText && onCtaClick && (
        <Button onClick={onCtaClick}>
          {ctaText}
        </Button>
      )}
    </div>
  );
}
