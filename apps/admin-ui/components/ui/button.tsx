import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white/[0.04] text-text-primary hover:bg-white/[0.06] border border-border shadow-sm",
        brand: "bg-brand text-brand-text font-semibold hover:bg-brand-dim shadow-sm shadow-brand/25 ring-1 ring-inset ring-white/15 hover:shadow-brand/30",
        destructive: "bg-danger/[0.08] text-danger hover:bg-danger/[0.12] border border-danger/10",
        outline: "border border-border text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-white/[0.03]",
        secondary: "bg-surface-2 text-text-primary shadow-sm hover:bg-surface-3",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-sm gap-2",
        sm: "h-8 px-3 text-sm gap-1.5",
        lg: "h-11 px-6 text-base gap-2",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
