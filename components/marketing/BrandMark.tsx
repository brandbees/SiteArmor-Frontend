import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Site Armor — home"
    >
      {/* Two artworks rather than a CSS filter: brightness-0/invert flattens the mark
          to a silhouette and loses the blue shield. The white file is authored for dark
          backgrounds and keeps the design intact. */}
      {/* The two files are cropped separately, so their intrinsic sizes differ. Passing the
          right pair keeps the reserved box the same shape as the artwork under h-14 w-auto. */}
      <Image
        src={inverse ? "/site-armor-logo-white-h.png" : "/site-armor-logo-h.png"}
        alt="Site Armor"
        width={inverse ? 2215 : 1785}
        height={inverse ? 595 : 495}
        priority
        className="h-14 w-auto object-contain"
      />
    </Link>
  );
}
