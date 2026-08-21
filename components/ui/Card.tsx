import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  /** Elevated variant — stronger border accent for featured content. */
  featured?: boolean;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  className,
  padding = "md",
  hover = false,
  featured = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border transition-all duration-base",
        featured && "border-accent/25 shadow-elevated-sm",
        hover && "hover:border-accent/30 hover:shadow-elevated-sm cursor-pointer",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-portal-display text-base font-bold tracking-tight text-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}
