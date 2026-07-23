import { ARENA_THEMES } from "../rendering/arenaThemes";

/**
 * Seeded expedition map: a horizontal 20-node starchart in the spirit of FTL's
 * sector map crossed with Slay the Spire's branching lanes. Pure and
 * Phaser-free so route fairness is unit-testable; the map screen renders a
 * snapshot of this and the run wires each node to an encounter.
 *
 * Topology: nodes sit on a column/lane grid. Edges only reach the next column,
 * straight ahead or one lane up/down, so every route is a left-to-right
 * traversal of 8 columns and no path can double back.
 */
export type ExpeditionNodeType =
  | "combat"
  | "elite"
  | "mini-boss"
  | "supply-depot"
  | "weapon-cache"
  | "shrine"
  | "event"
  | "boss";

export interface ExpeditionNode {
  id: number;
  type: ExpeditionNodeType;
  column: number;
  lane: number;
  /** Ids of nodes reachable from here (always in the next column). */
  next: readonly number[];
  /** Presentation-only theme id drawn from the arena pool. */
  themeId: string;
}

export interface ExpeditionMapData {
  seed: number;
  columns: number;
  lanes: number;
  nodes: readonly ExpeditionNode[];
  startNodeId: number;
  bossNodeId: number;
}

export const EXPEDITION_NODE_COUNT = 20;
export const EXPEDITION_COLUMNS = 8;
export const EXPEDITION_LANES = 3;

/**
 * Node-type budget for one map, excluding the fixed start and boss nodes.
 *
 * Shrine and Event are defined types with a full tested catalogue, resolver,
 * and review lab (`?screen=event-lab`), but they are intentionally NOT placed
 * on live charts yet: resolving one in a real run needs an in-run decision
 * scene plus the relic / weapon-slot / max-health systems several of their
 * outcomes grant, and placing unresolvable nodes would break a run. They move
 * into this budget (proposed shrine 1, event 2) the moment that gate lands.
 */
const TYPE_BUDGET: Readonly<
  Record<"elite" | "mini-boss" | "supply-depot" | "weapon-cache", number>
> = Object.freeze({
  elite: 2,
  "mini-boss": 2,
  "supply-depot": 2,
  "weapon-cache": 2,
});

/** Columns whose nodes may never be dangerous specials — the run must open calmly. */
const EARLY_COLUMN_LIMIT = 1;

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = (Math.floor(seed) || 1) >>> 0;
  }

  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(maxExclusive: number): number {
    return Math.min(Math.floor(this.next() * maxExclusive), maxExclusive - 1);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)]!;
  }
}

/**
 * Builds a deterministic map for a seed. The same seed always yields the same
 * chart, so bug reports and balance tests reproduce exactly.
 */
export function generateExpeditionMap(seed: number): ExpeditionMapData {
  const random = new SeededRandom(seed);
  const layout = buildLayout(random);
  assignTypes(layout, random);
  return {
    seed,
    columns: EXPEDITION_COLUMNS,
    lanes: EXPEDITION_LANES,
    nodes: layout.map((node) => Object.freeze({ ...node, next: Object.freeze([...node.next]) })),
    startNodeId: layout[0]!.id,
    bossNodeId: layout[layout.length - 1]!.id,
  };
}

interface MutableNode extends Omit<ExpeditionNode, "next"> {
  next: number[];
}

/**
 * Places 20 nodes: a single drop site, a single boss terminus, and the
 * remainder spread over the middle columns, then links each column forward.
 */
function buildLayout(random: SeededRandom): MutableNode[] {
  const middleColumns = EXPEDITION_COLUMNS - 2;
  const middleNodeCount = EXPEDITION_NODE_COUNT - 2;
  // Start every middle column with two nodes, then distribute the remainder.
  const counts = new Array<number>(middleColumns).fill(2);
  let remaining = middleNodeCount - middleColumns * 2;
  while (remaining > 0) {
    const column = random.int(middleColumns);
    if (counts[column]! < EXPEDITION_LANES) {
      counts[column]! += 1;
      remaining -= 1;
    }
  }

  const nodes: MutableNode[] = [];
  let nextId = 1;
  const centreLane = Math.floor(EXPEDITION_LANES / 2);

  nodes.push({
    id: nextId++,
    type: "combat",
    column: 0,
    lane: centreLane,
    next: [],
    themeId: ARENA_THEMES[0]!.id,
  });

  counts.forEach((count, index) => {
    const lanes = chooseLanes(count, random);
    for (const lane of lanes) {
      nodes.push({
        id: nextId++,
        type: "combat",
        column: index + 1,
        lane,
        next: [],
        themeId: random.pick(ARENA_THEMES).id,
      });
    }
  });

  nodes.push({
    id: nextId++,
    type: "boss",
    column: EXPEDITION_COLUMNS - 1,
    lane: centreLane,
    next: [],
    themeId: ARENA_THEMES[ARENA_THEMES.length - 1]!.id,
  });

  linkColumns(nodes, random);
  return nodes;
}

/** Distinct lanes for one column, biased to keep the middle lane populated. */
function chooseLanes(count: number, random: SeededRandom): number[] {
  const all = [0, 1, 2].slice(0, EXPEDITION_LANES);
  if (count >= all.length) {
    return all;
  }
  const chosen = new Set<number>([Math.floor(EXPEDITION_LANES / 2)]);
  while (chosen.size < count) {
    chosen.add(random.int(EXPEDITION_LANES));
  }
  return [...chosen].sort((left, right) => left - right);
}

/**
 * Connects each column to the next, allowing straight or one-lane diagonal
 * steps. Guarantees every node has an outgoing edge and every node past the
 * first has an incoming one, so no route dead-ends or is unreachable.
 */
function linkColumns(nodes: MutableNode[], random: SeededRandom): void {
  for (let column = 0; column < EXPEDITION_COLUMNS - 1; column += 1) {
    const current = nodes.filter((node) => node.column === column);
    const ahead = nodes.filter((node) => node.column === column + 1);

    for (const node of current) {
      const reachable = ahead.filter((candidate) => Math.abs(candidate.lane - node.lane) <= 1);
      const targets = reachable.length > 0 ? reachable : [nearestLane(ahead, node.lane)];
      // Always take the closest lane, then optionally branch to one more.
      const primary = nearestLane(targets, node.lane);
      node.next.push(primary.id);
      const extras = targets.filter((candidate) => candidate.id !== primary.id);
      if (extras.length > 0 && random.next() < 0.55) {
        node.next.push(random.pick(extras).id);
      }
    }

    // Any node in the next column with no incoming edge gets one from its
    // closest predecessor, keeping the chart fully connected.
    for (const target of ahead) {
      const hasIncoming = current.some((node) => node.next.includes(target.id));
      if (!hasIncoming) {
        const source = nearestLane(current, target.lane);
        source.next.push(target.id);
      }
    }
  }
}

function nearestLane(nodes: MutableNode[], lane: number): MutableNode {
  return nodes.reduce((closest, node) => (
    Math.abs(node.lane - lane) < Math.abs(closest.lane - lane) ? node : closest
  ));
}

/**
 * Assigns node types under the budget and fairness rules:
 * - the drop site and terminus are fixed;
 * - column 1 stays ordinary combat so runs open calmly;
 * - a Supply Depot is reachable before the first Mini-boss;
 * - no path steps directly from one Elite/Mini-boss into another.
 *
 * Placement order matters: the anchor Supply Depot goes down first because
 * Mini-boss legality depends on it, then dangerous nodes claim room while the
 * board is emptiest, then the remaining rewards fill in.
 */
function assignTypes(nodes: MutableNode[], random: SeededRandom): void {
  const assignable = nodes.filter((node) => (
    node.column > EARLY_COLUMN_LIMIT && node.column < EXPEDITION_COLUMNS - 1
  ));

  placeAnchorDepot(assignable, random);

  const remaining: ExpeditionNodeType[] = [];
  for (const [type, count] of Object.entries(TYPE_BUDGET) as [ExpeditionNodeType, number][]) {
    const alreadyPlaced = type === "supply-depot" ? 1 : 0;
    for (let index = 0; index < count - alreadyPlaced; index += 1) {
      remaining.push(type);
    }
  }
  remaining.sort((left, right) => typePriority(right) - typePriority(left));

  for (const type of remaining) {
    const candidates = assignable.filter((node) => (
      node.type === "combat" && isPlacementLegal(nodes, node, type)
    ));
    if (candidates.length === 0) {
      continue;
    }
    random.pick(candidates).type = type;
  }
}

/**
 * The first Supply Depot is placed in the earliest assignable column so a
 * Mini-boss always has a legal home behind it.
 */
function placeAnchorDepot(assignable: MutableNode[], random: SeededRandom): void {
  const earliestColumn = Math.min(...assignable.map((node) => node.column));
  const candidates = assignable.filter((node) => node.column === earliestColumn);
  random.pick(candidates).type = "supply-depot";
}

function typePriority(type: ExpeditionNodeType): number {
  if (type === "mini-boss") return 3;
  if (type === "elite") return 2;
  if (type === "supply-depot") return 1;
  return 0;
}

function isPlacementLegal(
  nodes: MutableNode[],
  node: MutableNode,
  type: ExpeditionNodeType,
): boolean {
  if (type === "mini-boss") {
    // Keep mini-bosses late enough that a build exists, and never before the
    // player could have found a Supply Depot.
    if (node.column < 3) {
      return false;
    }
    if (!hasDepotBefore(nodes, node)) {
      return false;
    }
  }
  if (type === "elite" || type === "mini-boss") {
    return !isAdjacentToDanger(nodes, node);
  }
  return true;
}

function isAdjacentToDanger(nodes: MutableNode[], node: MutableNode): boolean {
  const dangerous = (candidate: MutableNode) => candidate.type === "elite" || candidate.type === "mini-boss";
  if (node.next.some((id) => dangerous(nodeById(nodes, id)))) {
    return true;
  }
  return nodes.some((candidate) => candidate.next.includes(node.id) && dangerous(candidate));
}

/** True when at least one Supply Depot sits strictly before this node's column. */
function hasDepotBefore(nodes: MutableNode[], node: MutableNode): boolean {
  return nodes.some((candidate) => (
    candidate.type === "supply-depot" && candidate.column < node.column
  ));
}

function nodeById(nodes: MutableNode[], id: number): MutableNode {
  return nodes.find((node) => node.id === id)!;
}

export function expeditionNodeById(map: ExpeditionMapData, id: number): ExpeditionNode | null {
  return map.nodes.find((node) => node.id === id) ?? null;
}

/** Nodes selectable from the given position; the boss node ends the run. */
export function reachableNodes(map: ExpeditionMapData, fromNodeId: number): readonly ExpeditionNode[] {
  const from = expeditionNodeById(map, fromNodeId);
  if (!from) {
    return [];
  }
  return from.next
    .map((id) => expeditionNodeById(map, id))
    .filter((node): node is ExpeditionNode => node !== null);
}

/** Every node reachable from the drop site by following edges forward. */
export function traversableNodeIds(map: ExpeditionMapData): ReadonlySet<number> {
  const seen = new Set<number>([map.startNodeId]);
  const queue: number[] = [map.startNodeId];
  while (queue.length > 0) {
    const current = expeditionNodeById(map, queue.shift()!);
    for (const id of current?.next ?? []) {
      if (!seen.has(id)) {
        seen.add(id);
        queue.push(id);
      }
    }
  }
  return seen;
}

/** Shortest and longest encounter counts from drop site to boss, inclusive. */
export function routeLengthRange(map: ExpeditionMapData): { shortest: number; longest: number } {
  const lengths = new Map<number, { shortest: number; longest: number }>();
  const visit = (id: number): { shortest: number; longest: number } => {
    const cached = lengths.get(id);
    if (cached) {
      return cached;
    }
    const node = expeditionNodeById(map, id)!;
    if (node.next.length === 0) {
      const leaf = { shortest: 1, longest: 1 };
      lengths.set(id, leaf);
      return leaf;
    }
    let shortest = Number.POSITIVE_INFINITY;
    let longest = 0;
    for (const nextId of node.next) {
      const child = visit(nextId);
      shortest = Math.min(shortest, child.shortest + 1);
      longest = Math.max(longest, child.longest + 1);
    }
    const result = { shortest, longest };
    lengths.set(id, result);
    return result;
  };
  return visit(map.startNodeId);
}
