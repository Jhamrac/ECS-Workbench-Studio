import { NiagaraBlock, NiagaraLink } from '../types/niagara';

/**
 * Calculates a dynamic bounding height for a Niagara block based on its slot count
 */
export function getBlockRenderHeight(block: NiagaraBlock): number {
  const maxSlots = Math.max(block.inputs?.length || 0, block.outputs?.length || 0, 1);
  // Header (~36px) + slot rows (~24px each) + status footer/padding (~30px)
  return Math.max(140, 50 + maxSlots * 24);
}

/**
 * Intelligent DAG Topological & Collision-Free Auto-Layout for Niagara Wire Sheets.
 * Prevents any overlapping blocks, orders left-to-right from inputs to logic to outputs,
 * and maintains clean horizontal and vertical channels.
 */
export function autoLayoutNiagaraBlocks(
  blocks: NiagaraBlock[],
  links: NiagaraLink[],
  options: {
    startX?: number;
    startY?: number;
    colWidth?: number;
    minVerticalGap?: number;
  } = {}
): NiagaraBlock[] {
  if (!blocks || blocks.length === 0) return [];

  const {
    startX = 80,
    startY = 80,
    colWidth = 360,
    minVerticalGap = 36,
  } = options;

  const inDegree: Record<string, number> = {};
  const outgoing: Record<string, string[]> = {};
  const incoming: Record<string, string[]> = {};
  const blockMap = new Map<string, NiagaraBlock>();

  blocks.forEach((b) => {
    inDegree[b.id] = 0;
    outgoing[b.id] = [];
    incoming[b.id] = [];
    blockMap.set(b.id, b);
  });

  (links || []).forEach((l) => {
    if (inDegree[l.toBlockId] !== undefined) {
      inDegree[l.toBlockId] = (inDegree[l.toBlockId] || 0) + 1;
    }
    if (outgoing[l.fromBlockId]) {
      outgoing[l.fromBlockId].push(l.toBlockId);
    }
    if (incoming[l.toBlockId]) {
      incoming[l.toBlockId].push(l.fromBlockId);
    }
  });

  // Calculate ranks (columns 0, 1, 2, 3...)
  const ranks: Record<string, number> = {};

  // Assign initial rank 0 to blocks with 0 incoming links (or sensor/writable inputs)
  blocks.forEach((b) => {
    const isInputType =
      b.type.toLowerCase().includes('writable') ||
      b.type.toLowerCase().includes('point') ||
      b.type.toLowerCase().includes('sensor') ||
      b.name.toLowerCase().includes('temp') ||
      b.name.toLowerCase().includes('oat') ||
      b.name.toLowerCase().includes('sp') ||
      b.name.toLowerCase().includes('status');

    if (inDegree[b.id] === 0 || (isInputType && incoming[b.id].length === 0)) {
      ranks[b.id] = 0;
    }
  });

  // Topological forward propagation
  for (let pass = 0; pass < 8; pass++) {
    links.forEach((l) => {
      const fromRank = ranks[l.fromBlockId] ?? 0;
      const currentToRank = ranks[l.toBlockId] ?? 0;
      ranks[l.toBlockId] = Math.max(currentToRank, fromRank + 1);
    });
  }

  // Ensure unranked blocks get an appropriate column
  blocks.forEach((b) => {
    if (ranks[b.id] === undefined) {
      if (outgoing[b.id].length === 0 && incoming[b.id].length > 0) {
        ranks[b.id] = 3; // output column
      } else {
        ranks[b.id] = 1;
      }
    }
  });

  // Group blocks by column rank
  const columns: Record<number, NiagaraBlock[]> = {};
  blocks.forEach((b) => {
    const r = ranks[b.id] ?? 0;
    if (!columns[r]) columns[r] = [];
    columns[r].push(b);
  });

  const sortedRankKeys = Object.keys(columns)
    .map(Number)
    .sort((a, b) => a - b);

  // Position blocks column by column with dynamic height stacking
  const positionMap = new Map<string, { x: number; y: number }>();

  sortedRankKeys.forEach((colIndex) => {
    const colBlocks = columns[colIndex];
    let currentY = startY;
    const currentX = startX + colIndex * colWidth;

    // Sort blocks in column by average incoming source Y if available to untangle wires
    colBlocks.sort((a, b) => {
      const aIn = incoming[a.id] || [];
      const bIn = incoming[b.id] || [];
      const aAvgY =
        aIn.length > 0
          ? aIn.reduce((sum, id) => sum + (positionMap.get(id)?.y || 0), 0) / aIn.length
          : 0;
      const bAvgY =
        bIn.length > 0
          ? bIn.reduce((sum, id) => sum + (positionMap.get(id)?.y || 0), 0) / bIn.length
          : 0;
      return aAvgY - bAvgY;
    });

    colBlocks.forEach((block) => {
      positionMap.set(block.id, { x: currentX, y: currentY });
      const blockHeight = getBlockRenderHeight(block);
      currentY += blockHeight + minVerticalGap;
    });
  });

  // Return new blocks with spaced, non-overlapping coordinates
  return blocks.map((b) => {
    const pos = positionMap.get(b.id) || { x: b.x, y: b.y };
    return {
      ...b,
      x: pos.x,
      y: pos.y,
    };
  });
}
