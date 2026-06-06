import { create } from "zustand";

import type { FeedLocation } from "./schema";

type FeedNavigationState = {
  location: FeedLocation | null;
  hydratedFromUrl: boolean;
  setLocation: (location: FeedLocation) => void;
  markHydratedFromUrl: () => void;
};

export const useFeedNavigationStore = create<FeedNavigationState>((set) => ({
  location: null,
  hydratedFromUrl: false,
  setLocation: (location) => set({ location }),
  markHydratedFromUrl: () => set({ hydratedFromUrl: true }),
}));
