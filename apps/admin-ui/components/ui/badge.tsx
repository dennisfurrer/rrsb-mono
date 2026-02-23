import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border",
  {
    variants: {
      variant: {
        default: "bg-white/[0.03] text-text-secondary border-white/[0.04]",
        success: "bg-success/[0.08] text-success border-success/10",
        danger: "bg-danger/[0.08] text-danger border-danger/10",
        warning: "bg-warning/[0.08] text-warning border-warning/10",
        info: "bg-info/[0.08] text-info border-info/10",
        brand: "bg-brand/[0.08] text-brand border-brand/10",
        secondary: "bg-surface-2 text-text-secondary border-border",
        destructive: "bg-danger/[0.08] text-danger border-danger/10",
        outline: "text-text-secondary border-border",
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
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
