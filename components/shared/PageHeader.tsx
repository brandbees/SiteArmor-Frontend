import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

/** Portal page title — Space Grotesk display, muted subtitle */
export function PageHeader({
  title,
  description,
  action,
  className,
  icon,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-800 [&_svg]:size-[18px] [&_svg]:stroke-[1.5]">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="mc-page-title leading-tight">{title}</h1>
          {description ? (
            <p className="mc-page-sub mt-0.5">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  );
}
