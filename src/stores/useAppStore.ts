import { create } from "zustand";
import { AppMode, Product } from "../types";
import { useNavigationStore } from "./useNavigationStore";
import { getShelfApproach } from "../utils/pathfinding";
import type { CameraPreset } from "../data/cameraPresets";

function shelfDestination(product: Product | null) {
  const position = product?.has3D ? product.shelfLocation?.worldPos : undefined;
  return position ? getShelfApproach(position) ?? { x: position[0], z: position[2] } : null;
}

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
  hoveredDistance: number | null;
  setHoveredTarget: (product: Product | null, distance: number | null) => void;
  isPointerLocked: boolean;
  setIsPointerLocked: (locked: boolean) => void;

  activeNavigationProduct: Product | null;
  setActiveNavigationProduct: (product: Product | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  target3DPosition: [number, number, number] | null;
  setTarget3DPosition: (pos: [number, number, number] | null) => void;
  goToProductIn3D: (product: Product) => void;
  navigateToProductIn3D: (product: Product) => void;
  openProductIn2D: (product: Product) => void;

  virtualMove: { forward: number; right: number };
  setVirtualMove: (move: { forward: number; right: number }) => void;

  isAudioMuted: boolean;
  setIsAudioMuted: (muted: boolean) => void;
  toggleAudioMuted: () => void;

  fastTravelTarget: { x: number; z: number; heading?: number; label?: string } | null;
  setFastTravelTarget: (target: { x: number; z: number; heading?: number; label?: string } | null) => void;
  triggerFastTravel: (x: number, z: number, heading?: number, label?: string) => void;

  isOverviewMode: boolean;
  setIsOverviewMode: (overview: boolean) => void;
  activePresetTarget: CameraPreset | null;
  setActivePresetTarget: (preset: CameraPreset | null) => void;
  activateCameraPreset: (preset: CameraPreset) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: "2D",
  setMode: (mode) => {
    useNavigationStore.getState().setAutoWalking(false);
    set({ mode });
  },
  toggleMode: () => {
    useNavigationStore.getState().setAutoWalking(false);
    set((state) => ({ mode: state.mode === "2D" ? "3D" : "2D" }));
  },

  virtualMove: { forward: 0, right: 0 },
  setVirtualMove: (virtualMove) => set({ virtualMove }),

  isCartOpen: false,
  setIsCartOpen: (isCartOpen) => set({ isCartOpen }),

  isCheckoutOpen: false,
  setIsCheckoutOpen: (isCheckoutOpen) => set({ isCheckoutOpen }),

  inspectingProduct: null,
  setInspectingProduct: (inspectingProduct) => set({
    inspectingProduct,
    hoveredProduct: null,
    hoveredDistance: null,
  }),

  hoveredProduct: null,
  hoveredDistance: null,
  setHoveredProduct: (hoveredProduct) => set({ hoveredProduct, hoveredDistance: null }),
  setHoveredTarget: (hoveredProduct, hoveredDistance) => set((state) =>
    state.hoveredProduct === hoveredProduct && state.hoveredDistance === hoveredDistance
      ? state
      : { hoveredProduct, hoveredDistance }
  ),
  isPointerLocked: false,
  setIsPointerLocked: (isPointerLocked) => set({ isPointerLocked }),

  activeNavigationProduct: null,
  setActiveNavigationProduct: (activeNavigationProduct) => {
    useNavigationStore.getState().setDestination(shelfDestination(activeNavigationProduct));
    set({ activeNavigationProduct, target3DPosition: null });
  },

  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectedCategory: "Tất cả",
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  target3DPosition: null,
  setTarget3DPosition: (target3DPosition) => set({ target3DPosition }),

  goToProductIn3D: (product: Product) => {
    if (product.has3D && product.shelfLocation) {
      useNavigationStore.getState().setDestination(shelfDestination(product));
      set({
        mode: "3D",
        target3DPosition: product.shelfLocation.worldPos,
        hoveredProduct: null,
        hoveredDistance: null,
        activeNavigationProduct: product,
        isOverviewMode: false,
        activePresetTarget: null,
      });
    } else {
      useNavigationStore.getState().setDestination(null);
      set({
        mode: "3D",
        target3DPosition: null,
        hoveredProduct: null,
        hoveredDistance: null,
        activeNavigationProduct: null,
        isOverviewMode: false,
        activePresetTarget: null,
      });
    }
  },
  navigateToProductIn3D: (product) => {
    if (!product.has3D || !product.shelfLocation) {
      useNavigationStore.getState().setDestination(null);
      set({ mode: "2D", searchQuery: product.name, selectedCategory: "Tất cả",
        activeNavigationProduct: null, target3DPosition: null, hoveredProduct: null, hoveredDistance: null,
        isOverviewMode: false, activePresetTarget: null });
      return;
    }
    useNavigationStore.getState().setDestination(shelfDestination(product));
    set({ mode: "3D", activeNavigationProduct: product, target3DPosition: null,
      hoveredProduct: null, hoveredDistance: null, isOverviewMode: false, activePresetTarget: null });
  },
  openProductIn2D: (product) => {
    useNavigationStore.getState().setDestination(null);
    set({ mode: "2D", searchQuery: product.name, selectedCategory: "Tất cả", inspectingProduct: null,
      activeNavigationProduct: null, target3DPosition: null, hoveredProduct: null, hoveredDistance: null,
      isOverviewMode: false, activePresetTarget: null });
  },

  isAudioMuted: false,
  setIsAudioMuted: (isAudioMuted) => set({ isAudioMuted }),
  toggleAudioMuted: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),

  fastTravelTarget: null,
  setFastTravelTarget: (fastTravelTarget) => set({ fastTravelTarget }),
  triggerFastTravel: (x, z, heading, label) => {
    useNavigationStore.getState().setAutoWalking(false);
    useNavigationStore.getState().setDestination(null);
    set({
      mode: "3D",
      activeNavigationProduct: null,
      target3DPosition: null,
      fastTravelTarget: { x, z, heading, label },
      isOverviewMode: false,
      activePresetTarget: null,
    });
  },

  isOverviewMode: false,
  setIsOverviewMode: (isOverviewMode) => set({ isOverviewMode }),
  activePresetTarget: null,
  setActivePresetTarget: (activePresetTarget) => set({ activePresetTarget }),
  activateCameraPreset: (preset) => {
    useNavigationStore.getState().setAutoWalking(false);
    useNavigationStore.getState().setDestination(null);
    set({
      mode: "3D",
      activeNavigationProduct: null,
      target3DPosition: null,
      fastTravelTarget: null,
      isOverviewMode: Boolean(preset.hideCeiling || preset.isAerial),
      activePresetTarget: preset,
    });
  },
}));

