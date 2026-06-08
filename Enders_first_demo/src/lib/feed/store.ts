import { create } from "zustand";

import type { FeedLocation, FeedItem } from "./schema";

type FeedNavigationState = {
  location: FeedLocation | null;
  interests: Record<string, number>;
  isDeepDive: boolean;
  deepDiveAnchorItem: FeedItem | null;
  hydratedFromUrl: boolean;
  setLocation: (location: FeedLocation) => void;
  addInterest: (tags: string[], weight: number) => void;
  setDeepDive: (isDeepDive: boolean, item?: FeedItem | null) => void;
  markHydratedFromUrl: () => void;
};

export const useFeedNavigationStore = create<FeedNavigationState>((set) => ({
  location: null,
  interests: {},
  isDeepDive: false,
  deepDiveAnchorItem: null,
  hydratedFromUrl: false,
  setLocation: (location) => set({ location }),
  addInterest: (tags, weight) => set((state) => {
    const newInterests = { ...state.interests };
    tags.forEach(tag => {
      newInterests[tag] = (newInterests[tag] || 0) + weight;
    });
    return { interests: newInterests };
  }),
  setDeepDive: (isDeepDive, item = null) => set({ isDeepDive, deepDiveAnchorItem: item }),
  markHydratedFromUrl: () => set({ hydratedFromUrl: true }),
}));
