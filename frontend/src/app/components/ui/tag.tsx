import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { tagVariants } from "./tagVariants";
import { cn } from "./utils";



function Tag({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof tagVariants>) {
  return (
    <span
      className={cn(tagVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Tag };
