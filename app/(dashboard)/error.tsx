"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          {error.message || "An unexpected error occurred loading this page."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">ID: {error.digest}</p>
        )}
      </div>
      <Button variant="outline" onClick={reset}>Try again</Button>
    </div>
  );
}
