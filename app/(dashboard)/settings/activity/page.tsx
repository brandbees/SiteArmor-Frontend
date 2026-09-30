"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

/** Legacy URL — Activity Log lives under Settings → Activity Log tab. */
export default function ActivityPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?tab=activity");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
