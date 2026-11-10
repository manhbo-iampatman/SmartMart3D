import { create } from "zustand";

export type CheckoutPhase = "idle" | "scanning" | "payment" | "success";

export interface CheckoutStoreState {
  phase: CheckoutPhase;
  activeKioskId: string;
  currentItemIndex: number;
  scannedCount: number;
  scanProgress: number; // 0 to 1 for current item animation
  isAutoScanning: boolean;
  orderCode: string;
  paymentMethod: "vietqr" | "cod";

  // Actions
  setActiveKioskId: (kioskId: string) => void;
  startCheckout: () => void;
  setScanProgress: (progress: number) => void;
  advanceToNextItem: (totalItems: number) => void;
  skipScanning: (totalItems: number) => void;
  setPaymentMethod: (method: "vietqr" | "cod") => void;
  confirmPayment: () => void;
  resetCheckout: () => void;
}

export const generateOrderCode = (): string =>
  `SM3D-${Math.floor(100000 + Math.random() * 900000)}`;

export const useCheckoutStore = create<CheckoutStoreState>((set) => ({
  phase: "idle",
  activeKioskId: "checkout-04",
  currentItemIndex: 0,
  scannedCount: 0,
  scanProgress: 0,
  isAutoScanning: false,
  orderCode: generateOrderCode(),
  paymentMethod: "vietqr",

  setActiveKioskId: (activeKioskId: string) => set({ activeKioskId }),

  startCheckout: () => {
    set({
      phase: "scanning",
      currentItemIndex: 0,
      scannedCount: 0,
      scanProgress: 0,
      isAutoScanning: true,
      orderCode: generateOrderCode(),
    });
  },

  setScanProgress: (scanProgress: number) => {
    set({ scanProgress });
  },

  advanceToNextItem: (totalItems: number) => {
    set((state) => {
      const nextScanned = state.scannedCount + 1;
      if (nextScanned >= totalItems) {
        return {
          scannedCount: totalItems,
          currentItemIndex: totalItems - 1,
          scanProgress: 1,
          phase: "payment",
          isAutoScanning: false,
        };
      }
      return {
        scannedCount: nextScanned,
        currentItemIndex: state.currentItemIndex + 1,
        scanProgress: 0,
      };
    });
  },

  skipScanning: (totalItems: number) => {
    set({
      scannedCount: totalItems,
      currentItemIndex: Math.max(0, totalItems - 1),
      scanProgress: 1,
      phase: "payment",
      isAutoScanning: false,
    });
  },

  setPaymentMethod: (paymentMethod: "vietqr" | "cod") => {
    set({ paymentMethod });
  },

  confirmPayment: () => {
    set({
      phase: "success",
    });
  },

  resetCheckout: () => {
    set({
      phase: "idle",
      currentItemIndex: 0,
      scannedCount: 0,
      scanProgress: 0,
      isAutoScanning: false,
      orderCode: generateOrderCode(),
      paymentMethod: "vietqr",
    });
  },
}));

