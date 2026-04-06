"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-3 p-8">
          <h1 className="text-2xl font-bold">Application Error</h1>
          <p className="text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
          <button
            className="px-4 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
            onClick={reset}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
