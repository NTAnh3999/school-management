import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-primary/15",
  {
    variants: {
      variant: {
        default:
          "border-primary/10 bg-primary/10 text-primary",
        secondary:
          "border-secondary/10 bg-secondary/10 text-secondary",
        destructive:
          "border-destructive/10 bg-destructive/10 text-destructive",
        outline: "border-outline-variant bg-white/70 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
