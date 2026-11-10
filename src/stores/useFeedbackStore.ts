import { create } from "zustand";

interface CartNotice {
  id: number;
  productName: string;
  quantity: number;
}

interface FeedbackState {
  soundEnabled: boolean;
  notice: CartNotice | null;
  setSoundEnabled: (enabled: boolean) => void;
  showCartNotice: (productName: string, quantity: number) => void;
  dismissNotice: (id: number) => void;
}

let nextNoticeId = 0;

export const useFeedbackStore = create<FeedbackState>((set) => ({
  soundEnabled: true,
  notice: null,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  showCartNotice: (productName, quantity) => set({
    notice: { id: ++nextNoticeId, productName, quantity },
  }),
  dismissNotice: (id) => set((state) =>
    state.notice?.id === id ? { notice: null } : state
  ),
}));
