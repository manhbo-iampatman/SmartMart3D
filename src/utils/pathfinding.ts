import { STORE_LAYOUT, type FloorPoint, type NavigationLayout } from "../data/storeLayout";

export const floorDistance = (a: FloorPoint, b: FloorPoint) => Math.hypot(a.x - b.x, a.z - b.z);

function isWalkableRaw(x: number, z: number, layout: NavigationLayout): boolean {
  const radius = layout.playerRadius;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(z) ||
    x < layout.minX + radius ||
    x > layout.maxX - radius ||
    z < layout.minZ + radius ||
    z > layout.maxZ - radius
  ) {
    return false;
  }
  const obs = layout.obstacles;
  for (let i = 0; i < obs.length; i++) {
    const o = obs[i];
    if (o.kind === "circle") {
      if (Math.hypot(x - o.x, z - o.z) <= o.radius + radius) return false;
    } else if (
      Math.abs(x - o.x) <= o.width / 2 + radius &&
      Math.abs(z - o.z) <= o.depth / 2 + radius
    ) {
      return false;
    }
  }
  return true;
}

export function isWalkable(point: FloorPoint, layout = STORE_LAYOUT): boolean {
  return isWalkableRaw(point.x, point.z, layout);
}

function isWalkableSegmentCoords(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  layout: NavigationLayout
): boolean {
  if (!isWalkableRaw(ax, az, layout) || !isWalkableRaw(bx, bz, layout)) return false;
  const dx = bx - ax;
  const dz = bz - az;
  const radius = layout.playerRadius;
  const obs = layout.obstacles;

  for (let i = 0; i < obs.length; i++) {
    const obstacle = obs[i];
    if (obstacle.kind === "circle") {
      const lengthSquared = dx * dx + dz * dz;
      const t =
        lengthSquared === 0
          ? 0
          : Math.max(
              0,
              Math.min(1, ((obstacle.x - ax) * dx + (obstacle.z - az) * dz) / lengthSquared)
            );
      if (Math.hypot(ax + dx * t - obstacle.x, az + dz * t - obstacle.z) <= obstacle.radius + radius) {
        return false;
      }
      continue;
    }

    let enter = 0;
    let leave = 1;
    let blocked = true;

    const halfX = obstacle.width / 2 + radius;
    if (Math.abs(dx) < 1e-10) {
      if (ax < obstacle.x - halfX || ax > obstacle.x + halfX) blocked = false;
    } else {
      const lowX = (obstacle.x - halfX - ax) / dx;
      const highX = (obstacle.x + halfX - ax) / dx;
      enter = Math.max(enter, Math.min(lowX, highX));
      leave = Math.min(leave, Math.max(lowX, highX));
      if (enter > leave) blocked = false;
    }

    if (blocked) {
      const halfZ = obstacle.depth / 2 + radius;
      if (Math.abs(dz) < 1e-10) {
        if (az < obstacle.z - halfZ || az > obstacle.z + halfZ) blocked = false;
      } else {
        const lowZ = (obstacle.z - halfZ - az) / dz;
        const highZ = (obstacle.z + halfZ - az) / dz;
        enter = Math.max(enter, Math.min(lowZ, highZ));
        leave = Math.min(leave, Math.max(lowZ, highZ));
        if (enter > leave) blocked = false;
      }
    }

    if (blocked) return false;
  }
  return true;
}

/** Swept segment test, including the player's radius; not just an endpoint check. */
export function isWalkableSegment(a: FloorPoint, b: FloorPoint, layout = STORE_LAYOUT): boolean {
  return isWalkableSegmentCoords(a.x, a.z, b.x, b.z, layout);
}

export function moveWithCollisions(from: FloorPoint, to: FloorPoint): FloorPoint {
  if (isWalkableSegment(from, to)) return to;
  const alongX = { x: to.x, z: from.z };
  if (isWalkableSegment(from, alongX)) return alongX;
  const alongZ = { x: from.x, z: to.z };
  return isWalkableSegment(from, alongZ) ? alongZ : from;
}

/** A standing point in front of a shelf or display island, never inside a fixture. */
export function getShelfApproach(worldPosition: [number, number, number]): FloorPoint | null {
  const [x, , z] = worldPosition;
  for (const offset of [0.8, 0.65, 1.1]) {
    for (const shift of [0, -0.2, 0.2, -0.4, 0.4]) {
      const point = { x: x + (x > 0 ? -offset : offset), z: z + shift };
      if (isWalkable(point)) return point;
    }
  }
  const candidates: FloorPoint[] = [];
  for (const zOffset of [0.95, 1.15, 1.35, 1.6]) {
    for (const shift of [0, -0.35, 0.35, -0.7, 0.7]) {
      candidates.push({ x: x + shift, z: z + zOffset });
      candidates.push({ x: x + shift, z: z - zOffset });
    }
  }
  for (const xOffset of [1.35, 1.6, 1.85]) {
    for (const shift of [0, -0.35, 0.35]) {
      candidates.push({ x: x - xOffset, z: z + shift });
      candidates.push({ x: x + xOffset, z: z + shift });
    }
  }
  const targetPoint = { x, z };
  let best: FloorPoint | null = null;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    if (!isWalkable(candidate)) continue;
    const d = floorDistance(candidate, targetPoint);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }
  return best;
}

const NEIGHBOR_DX = [-1, 0, 1, -1, 1, -1, 0, 1];
const NEIGHBOR_DZ = [-1, -1, -1, 0, 0, 1, 1, 1];

interface GridCache {
  columns: number;
  rows: number;
  cellSize: number;
  playerRadius: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  obstaclesRef: readonly unknown[];
  obstaclesLen: number;
  walkableMask: Uint8Array;
  edgeComputed: Uint8Array;
  edgeMask: Uint8Array;
  costs: Float64Array;
  parents: Int32Array;
  closedEpoch: Uint32Array;
  visitedEpoch: Uint32Array;
  currentEpoch: number;
}

const layoutGridCache = new WeakMap<NavigationLayout, GridCache>();

function getGridCache(layout: NavigationLayout): GridCache {
  const existing = layoutGridCache.get(layout);
  if (
    existing &&
    existing.obstaclesRef === layout.obstacles &&
    existing.obstaclesLen === layout.obstacles.length &&
    existing.cellSize === layout.cellSize &&
    existing.playerRadius === layout.playerRadius &&
    existing.minX === layout.minX &&
    existing.maxX === layout.maxX &&
    existing.minZ === layout.minZ &&
    existing.maxZ === layout.maxZ
  ) {
    return existing;
  }

  const columns = Math.floor((layout.maxX - layout.minX) / layout.cellSize) + 1;
  const rows = Math.floor((layout.maxZ - layout.minZ) / layout.cellSize) + 1;
  const total = columns * rows;

  const walkableMask = new Uint8Array(total);
  for (let z = 0; z < rows; z++) {
    const wz = layout.minZ + z * layout.cellSize;
    const rowBase = z * columns;
    for (let x = 0; x < columns; x++) {
      const wx = layout.minX + x * layout.cellSize;
      walkableMask[rowBase + x] = isWalkableRaw(wx, wz, layout) ? 1 : 0;
    }
  }

  const cache: GridCache = {
    columns,
    rows,
    cellSize: layout.cellSize,
    playerRadius: layout.playerRadius,
    minX: layout.minX,
    maxX: layout.maxX,
    minZ: layout.minZ,
    maxZ: layout.maxZ,
    obstaclesRef: layout.obstacles,
    obstaclesLen: layout.obstacles.length,
    walkableMask,
    edgeComputed: new Uint8Array(total),
    edgeMask: new Uint8Array(total),
    costs: new Float64Array(total),
    parents: new Int32Array(total),
    closedEpoch: new Uint32Array(total),
    visitedEpoch: new Uint32Array(total),
    currentEpoch: 0,
  };
  layoutGridCache.set(layout, cache);
  return cache;
}

interface OpenNode { id: number; cost: number; priority: number }
class MinHeap {
  private nodes: OpenNode[] = [];
  get length() { return this.nodes.length; }
  push(node: OpenNode) {
    let index = this.nodes.length;
    this.nodes.push(node);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.nodes[parent].priority <= node.priority) break;
      this.nodes[index] = this.nodes[parent];
      index = parent;
    }
    this.nodes[index] = node;
  }
  pop(): OpenNode {
    const first = this.nodes[0];
    const last = this.nodes.pop()!;
    if (this.nodes.length > 0) {
      let index = 0;
      while (index * 2 + 1 < this.nodes.length) {
        let child = index * 2 + 1;
        if (child + 1 < this.nodes.length && this.nodes[child + 1].priority < this.nodes[child].priority) child++;
        if (last.priority <= this.nodes[child].priority) break;
        this.nodes[index] = this.nodes[child];
        index = child;
      }
      this.nodes[index] = last;
    }
    return first;
  }
}

/** A* on an 8-connected walkable grid with WeakMap grid cache (< 1ms per path). */
export function findPath(start: FloorPoint, goal: FloorPoint, layout: NavigationLayout = STORE_LAYOUT): FloorPoint[] | null {
  if (!isWalkable(start, layout) || !isWalkable(goal, layout)) return null;
  if (floorDistance(start, goal) < 1e-6) return [{ ...goal }];
  if (isWalkableSegment(start, goal, layout)) return [{ ...start }, { ...goal }];

  const grid = getGridCache(layout);
  const { columns, rows, walkableMask, edgeComputed, edgeMask, costs, parents, closedEpoch, visitedEpoch } = grid;
  grid.currentEpoch = (grid.currentEpoch + 1) >>> 0;
  if (grid.currentEpoch === 0) {
    closedEpoch.fill(0);
    visitedEpoch.fill(0);
    grid.currentEpoch = 1;
  }
  const epoch = grid.currentEpoch;

  const snap = (point: FloorPoint): number | null => {
    const column = Math.round((point.x - layout.minX) / layout.cellSize);
    const row = Math.round((point.z - layout.minZ) / layout.cellSize);
    let result: number | null = null;
    let bestDistance = Infinity;
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = column + dx;
        const z = row + dz;
        if (x < 0 || x >= columns || z < 0 || z >= rows) continue;
        const id = z * columns + x;
        if (!walkableMask[id]) continue;
        const wx = layout.minX + x * layout.cellSize;
        const wz = layout.minZ + z * layout.cellSize;
        const distance = Math.hypot(point.x - wx, point.z - wz);
        if (distance < bestDistance && isWalkableSegmentCoords(point.x, point.z, wx, wz, layout)) {
          bestDistance = distance;
          result = id;
        }
      }
    }
    return result;
  };

  const source = snap(start);
  const destination = snap(goal);
  if (source === null || destination === null) return null;

  const destCol = destination % columns;
  const destRow = Math.floor(destination / columns);
  const destX = layout.minX + destCol * layout.cellSize;
  const destZ = layout.minZ + destRow * layout.cellSize;
  const orthoStep = layout.cellSize;
  const diagStep = layout.cellSize * Math.SQRT2;

  // Epoch tracking avoids reallocating O(N) buffers on every A* call
  const costEpoch = costs;
  visitedEpoch[source] = epoch;
  costEpoch[source] = 0;
  parents[source] = -1;

  const open = new MinHeap();
  const srcX = layout.minX + (source % columns) * layout.cellSize;
  const srcZ = layout.minZ + Math.floor(source / columns) * layout.cellSize;
  open.push({ id: source, cost: 0, priority: Math.hypot(srcX - destX, srcZ - destZ) });

  while (open.length > 0) {
    const node = open.pop();
    if (closedEpoch[node.id] === epoch || node.cost > costEpoch[node.id]) continue;
    if (node.id === destination) {
      const raw: FloorPoint[] = [{ ...goal }];
      for (let id = destination; id !== -1; id = parents[id]) {
        raw.push({
          x: layout.minX + (id % columns) * layout.cellSize,
          z: layout.minZ + Math.floor(id / columns) * layout.cellSize,
        });
      }
      raw.push({ ...start });
      raw.reverse();
      const path = [raw[0]];
      for (let anchor = 0; anchor < raw.length - 1;) {
        let next = raw.length - 1;
        while (next > anchor + 1 && !isWalkableSegment(raw[anchor], raw[next], layout)) next--;
        if (floorDistance(path[path.length - 1], raw[next]) > 1e-6) path.push(raw[next]);
        anchor = next;
      }
      return path;
    }

    closedEpoch[node.id] = epoch;
    const column: number = node.id % columns;
    const row: number = Math.floor(node.id / columns);
    const px = layout.minX + column * layout.cellSize;
    const pz = layout.minZ + row * layout.cellSize;

    // Tính & cache sẵn 8 bit láng giềng hợp lệ cho node này (0% trùng lặp tính toán cho các lần gọi sau)
    if (!edgeComputed[node.id]) {
      let mask = 0;
      for (let dir = 0; dir < 8; dir++) {
        const dx = NEIGHBOR_DX[dir];
        const dz = NEIGHBOR_DZ[dir];
        const nx: number = column + dx;
        const nz: number = row + dz;
        if (nx < 0 || nx >= columns || nz < 0 || nz >= rows) continue;
        const nid = nz * columns + nx;
        if (!walkableMask[nid]) continue;
        if (dx !== 0 && dz !== 0) {
          if (!walkableMask[row * columns + nx] || !walkableMask[nz * columns + column]) continue;
        }
        const cx = layout.minX + nx * layout.cellSize;
        const cz = layout.minZ + nz * layout.cellSize;
        if (isWalkableSegmentCoords(px, pz, cx, cz, layout)) {
          mask |= 1 << dir;
        }
      }
      edgeMask[node.id] = mask;
      edgeComputed[node.id] = 1;
    }

    const validMask = edgeMask[node.id];
    for (let dir = 0; dir < 8; dir++) {
      if ((validMask & (1 << dir)) === 0) continue;
      const dx = NEIGHBOR_DX[dir];
      const dz = NEIGHBOR_DZ[dir];
      const nx: number = column + dx;
      const nz: number = row + dz;
      const nid = nz * columns + nx;
      if (closedEpoch[nid] === epoch) continue;

      const nextCost = node.cost + (dx !== 0 && dz !== 0 ? diagStep : orthoStep);
      if (visitedEpoch[nid] === epoch && nextCost >= costEpoch[nid]) continue;

      visitedEpoch[nid] = epoch;
      costEpoch[nid] = nextCost;
      parents[nid] = node.id;

      const cx = layout.minX + nx * layout.cellSize;
      const cz = layout.minZ + nz * layout.cellSize;
      open.push({
        id: nid,
        cost: nextCost,
        priority: nextCost + Math.hypot(cx - destX, cz - destZ),
      });
    }
  }
  return null;
}

export function pathLength(path: readonly FloorPoint[]): number {
  return path.reduce((sum, point, index) => (index ? sum + floorDistance(path[index - 1], point) : 0), 0);
}
