import { create } from "zustand";
import { AppMode, Product } from "../types";

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;

  inspectingProduct: Product | null;
  setInspectingProduct: (product: Product | null) => void;

  hoveredProduct: Product | null;
  setHoveredProduct: (product: Product | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  target3DPosition: [number, number, number] | null;
  setTarget3DPosition: (pos: [number, number, number] | null) => void;
  goToProductIn3D: (product: Product) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: "2D",
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((state) => ({ mode: state.mode === "2D" ? "3D" : "2D" })),

  isCartOpen: false,
  setIsCartOpen: (isCartOpen) => set({ isCartOpen }),

  isCheckoutOpen: false,
  setIsCheckoutOpen: (isCheckoutOpen) => set({ isCheckoutOpen }),

  inspectingProduct: null,
  setInspectingProduct: (inspectingProduct) => set({ inspectingProduct }),

  hoveredProduct: null,
  setHoveredProduct: (hoveredProduct) => set({ hoveredProduct }),

  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectedCategory: "Tất cả",
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  target3DPosition: null,
  setTarget3DPosition: (target3DPosition) => set({ target3DPosition }),

  goToProductIn3D: (product: Product) => {
    if (product.shelfLocation) {
      set({
        mode: "3D",
        target3DPosition: product.shelfLocation.worldPos,
        hoveredProduct: product,
      });
    } else {
      set({ mode: "3D" });
    }
  },
}));

