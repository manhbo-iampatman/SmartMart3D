import { create } from "zustand";
import { ENTRANCE, type FloorPoint } from "../data/storeLayout";
import { findPath, floorDistance, isWalkableSegment, pathLength } from "../utils/pathfinding";

export type NavigationStatus = "idle" | "navigating" | "arrived" | "unreachable";
export const ARRIVAL_DISTANCE = 0.28;

interface NavigationState {
  player: FloorPoint;
  heading: number;
  destination: FloorPoint | null;
  path: FloorPoint[];
  distance: number | null;
  status: NavigationStatus;
  autoWalking: boolean;
  updatePose: (point: FloorPoint, heading: number, forcePlan?: boolean) => void;
  setDestination: (point: FloorPoint | null) => void;
  setAutoWalking: (active: boolean) => void;
}

function plan(player: FloorPoint, destination: FloorPoint | null) {
  if (!destination) return { path: [], distance: null, status: "idle" as const };
  if (floorDistance(player, destination) <= ARRIVAL_DISTANCE && isWalkableSegment(player, destination)) {
    return { path: [player, destination], distance: 0, status: "arrived" as const };
  }
  const path = findPath(player, destination);
  return path
    ? { path, distance: pathLength(path), status: "navigating" as const }
    : { path: [], distance: null, status: "unreachable" as const };
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  player: { ...ENTRANCE }, heading: 0, destination: null,
  path: [], distance: null, status: "idle", autoWalking: false,
  updatePose: (player, heading, forcePlan = false) => {
    const state = get();
    const moved = forcePlan || floorDistance(state.player, player) > 0.015;
    if (!moved && Math.abs(heading - state.heading) < 0.025) return;
    const route: Partial<ReturnType<typeof plan>> = moved ? plan(player, state.destination) : {};
    set({ player: { ...player }, heading, ...route,
      ...(route.status && route.status !== "navigating" ? { autoWalking: false } : {}),
    });
  },
  setDestination: (destination) => set({ destination, ...plan(get().player, destination), autoWalking: false }),
  setAutoWalking: (active) => set({ autoWalking: active && get().status === "navigating" }),
}));
