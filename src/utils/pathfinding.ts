import { STORE_LAYOUT, type FloorPoint, type NavigationLayout } from "../data/storeLayout";

export const floorDistance = (a: FloorPoint, b: FloorPoint) => Math.hypot(a.x - b.x, a.z - b.z);

export function isWalkable(point: FloorPoint, layout = STORE_LAYOUT): boolean {
  const radius = layout.playerRadius;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z) ||
    point.x < layout.minX + radius || point.x > layout.maxX - radius ||
    point.z < layout.minZ + radius || point.z > layout.maxZ - radius) return false;
  return !layout.obstacles.some((obstacle) => obstacle.kind === "circle"
    ? floorDistance(point, obstacle) <= obstacle.radius + radius
    : Math.abs(point.x - obstacle.x) <= obstacle.width / 2 + radius &&
      Math.abs(point.z - obstacle.z) <= obstacle.depth / 2 + radius);
}

/** Swept segment test, including the player's radius; not just an endpoint check. */
export function isWalkableSegment(a: FloorPoint, b: FloorPoint, layout = STORE_LAYOUT): boolean {
  if (!isWalkable(a, layout) || !isWalkable(b, layout)) return false;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return !layout.obstacles.some((obstacle) => {
    if (obstacle.kind === "circle") {
      const lengthSquared = dx * dx + dz * dz;
      const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
        ((obstacle.x - a.x) * dx + (obstacle.z - a.z) * dz) / lengthSquared));
      return floorDistance({ x: a.x + dx * t, z: a.z + dz * t }, obstacle) <= obstacle.radius + layout.playerRadius;
    }
    let enter = 0;
    let leave = 1;
    for (const [origin, delta, center, halfSize] of [
      [a.x, dx, obstacle.x, obstacle.width / 2 + layout.playerRadius],
      [a.z, dz, obstacle.z, obstacle.depth / 2 + layout.playerRadius],
    ]) {
      if (Math.abs(delta) < 1e-10) {
        if (origin < center - halfSize || origin > center + halfSize) return false;
      } else {
        const low = (center - halfSize - origin) / delta;
        const high = (center + halfSize - origin) / delta;
        enter = Math.max(enter, Math.min(low, high));
        leave = Math.min(leave, Math.max(low, high));
        if (enter > leave) return false;
      }
    }
    return true;
  });
}

export function moveWithCollisions(from: FloorPoint, to: FloorPoint): FloorPoint {
  if (isWalkableSegment(from, to)) return to;
  const alongX = { x: to.x, z: from.z };
  if (isWalkableSegment(from, alongX)) return alongX;
  const alongZ = { x: from.x, z: to.z };
  return isWalkableSegment(from, alongZ) ? alongZ : from;
}

/** A standing point in front of a shelf, never inside a fixture. */
export function getShelfApproach(worldPosition: [number, number, number]): FloorPoint | null {
  const [x, , z] = worldPosition;
  for (const offset of [0.8, 0.65, 1.1]) {
    for (const shift of [0, -0.2, 0.2, -0.4, 0.4]) {
      const point = { x: x + (x > 0 ? -offset : offset), z: z + shift };
      if (isWalkable(point)) return point;
    }
  }
  return null;
}

interface OpenNode { id: number; cost: number; priority: number }
class MinHeap {
  private nodes: OpenNode[] = [];
  get length() { return this.nodes.length; }
  push(node: OpenNode) {
    let index = this.nodes.length;
    this.nodes.push(node);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
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

/** A* on an 8-connected walkable grid; diagonal corner cutting is forbidden. */
export function findPath(start: FloorPoint, goal: FloorPoint, layout: NavigationLayout = STORE_LAYOUT): FloorPoint[] | null {
  if (!isWalkable(start, layout) || !isWalkable(goal, layout)) return null;
  if (floorDistance(start, goal) < 1e-6) return [{ ...goal }];
  if (isWalkableSegment(start, goal, layout)) return [{ ...start }, { ...goal }];

  const columns = Math.floor((layout.maxX - layout.minX) / layout.cellSize) + 1;
  const rows = Math.floor((layout.maxZ - layout.minZ) / layout.cellSize) + 1;
  const pointOf = (id: number): FloorPoint => ({
    x: layout.minX + (id % columns) * layout.cellSize,
    z: layout.minZ + Math.floor(id / columns) * layout.cellSize,
  });
  const snap = (point: FloorPoint): number | null => {
    const column = Math.round((point.x - layout.minX) / layout.cellSize);
    const row = Math.round((point.z - layout.minZ) / layout.cellSize);
    let result: number | null = null;
    let bestDistance = Infinity;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const x = column + dx;
      const z = row + dz;
      if (x < 0 || x >= columns || z < 0 || z >= rows) continue;
      const id = z * columns + x;
      const candidate = pointOf(id);
      const distance = floorDistance(point, candidate);
      if (distance < bestDistance && isWalkableSegment(point, candidate, layout)) {
        bestDistance = distance;
        result = id;
      }
    }
    return result;
  };
  const source = snap(start);
  const destination = snap(goal);
  if (source === null || destination === null) return null;

  const costs = new Float64Array(columns * rows).fill(Infinity);
  const parents = new Int32Array(columns * rows).fill(-1);
  const closed = new Uint8Array(columns * rows);
  const open = new MinHeap();
  costs[source] = 0;
  open.push({ id: source, cost: 0, priority: floorDistance(pointOf(source), pointOf(destination)) });
  while (open.length > 0) {
    const node = open.pop();
    if (closed[node.id] || node.cost > costs[node.id]) continue;
    if (node.id === destination) {
      const raw: FloorPoint[] = [{ ...goal }];
      for (let id = destination; id !== -1; id = parents[id]) raw.push(pointOf(id));
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
    closed[node.id] = 1;
    const column = node.id % columns;
    const row = Math.floor(node.id / columns);
    const point = pointOf(node.id);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const x = column + dx;
      const z = row + dz;
      if (x < 0 || x >= columns || z < 0 || z >= rows) continue;
      const id = z * columns + x;
      if (closed[id]) continue;
      const candidate = pointOf(id);
      if (!isWalkableSegment(point, candidate, layout)) continue;
      if (dx && dz && (!isWalkable(pointOf(row * columns + x), layout) || !isWalkable(pointOf(z * columns + column), layout))) continue;
      const cost = node.cost + floorDistance(point, candidate);
      if (cost >= costs[id]) continue;
      costs[id] = cost;
      parents[id] = node.id;
      open.push({ id, cost, priority: cost + floorDistance(candidate, pointOf(destination)) });
    }
  }
  return null;
}

export function pathLength(path: readonly FloorPoint[]): number {
  return path.reduce((sum, point, index) => index ? sum + floorDistance(path[index - 1], point) : 0, 0);
}
