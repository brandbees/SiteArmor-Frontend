import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  className,
  icon,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {icon ? <span className="text-accent">{icon}</span> : null}
          <h1 className="font-portal-display text-[1.75rem] font-bold leading-none tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="mt-2 text-sm font-medium text-accent">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  );
}
