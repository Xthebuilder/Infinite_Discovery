"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { AnalyticsProvider } from "@/lib/analytics/analytics";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_MSW !== "off"
    ) {
      void import("@/mocks/browser")
        .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
        .catch(() => undefined);
    }
  }, []);

  return (
    <AnalyticsProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AnalyticsProvider>
  );
}
