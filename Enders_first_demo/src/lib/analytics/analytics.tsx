"use client";

import posthog from "posthog-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

type AnalyticsContextValue = {
  track: (event: AnalyticsEvent) => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: () => undefined,
});

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (!key) {
      return;
    }

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
    });
  }, []);

  const track = useCallback((event: AnalyticsEvent) => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      console.info("[analytics]", event.name, event.properties ?? {});
      return;
    }

    posthog.capture(event.name, event.properties);
  }, []);

  const value = useMemo(() => ({ track }), [track]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
