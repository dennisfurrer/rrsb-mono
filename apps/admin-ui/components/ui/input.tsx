import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg bg-white/[0.02] border border-border px-3.5 text-sm text-text-primary",
          "placeholder:text-text-muted/60",
          "focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-150",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-secondary",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
