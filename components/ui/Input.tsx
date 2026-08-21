import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const fieldBase =
  "w-full rounded-[4px] border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
          <input
            ref={ref}
            className={cn(fieldBase, "py-2.5 pl-9 pr-3", className)}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(fieldBase, "px-3 py-2.5", className)}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
