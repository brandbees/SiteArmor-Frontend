import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer";
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </Tag>
  );
}

export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "muted" | "inverse" | "accent-wash";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-14 sm:py-16 lg:py-20",
        tone === "default" && "bg-[var(--mkt-bg)]",
        tone === "muted" && "bg-[var(--mkt-bg-muted)]",
        tone === "inverse" && "bg-[var(--mkt-inverse)] text-[var(--mkt-inverse-fg)]",
        tone === "accent-wash" && "bg-[var(--mkt-wash)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  size = "default",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  size?: "default" | "hero";
  className?: string;
}) {
  return (
    <div
      className={cn(
        size === "hero" ? "mb-10 sm:mb-12" : "mb-8 sm:mb-10",
        align === "center" && "mx-auto max-w-3xl text-center",
        align === "left" && "max-w-3xl text-left",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent sm:text-[13px]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-[family-name:var(--font-marketing-display)] font-bold tracking-tight text-[var(--mkt-fg)]",
          size === "hero"
            ? "text-3xl leading-[1.1] sm:text-4xl lg:text-5xl lg:leading-[1.08]"
            : "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 leading-relaxed text-[var(--mkt-muted)]",
            size === "hero" ? "text-lg sm:text-xl" : "text-base sm:text-lg"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
