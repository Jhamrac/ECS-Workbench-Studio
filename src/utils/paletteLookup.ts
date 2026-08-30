import { NIAGARA_PALETTE_ITEMS } from '../data/paletteDefinitions';

export interface PaletteLocationInfo {
  jarFile: string;
  folderPath: string;
  componentName: string;
  category: string;
  workbenchPath: string;
  description: string;
  color: string;
}

/**
 * Returns exact Niagara Workbench palette location and navigation path for any block type.
 */
export function getBlockPaletteLocation(blockType: string, fallbackPalette?: string): PaletteLocationInfo {
  // Check against palette definitions list
  const foundItem = NIAGARA_PALETTE_ITEMS.find(
    (p) => p.type.toLowerCase() === blockType.toLowerCase()
  );

  if (foundItem) {
    const parts = foundItem.palette.split(':');
    const jar = parts[0] || 'kitControl';
    const folder = parts[1] || foundItem.category.toLowerCase();

    return {
      jarFile: `${jar}.jar`,
      folderPath: `${jar} > ${folder}`,
      componentName: foundItem.type,
      category: foundItem.category,
      workbenchPath: `Palette Window (Ctrl+L) → ${jar} → ${folder} → ${foundItem.type}`,
      description: foundItem.description || `Standard Tridium Niagara ${foundItem.type} component`,
      color: foundItem.color || '#0284c7',
    };
  }

  // Fallback heuristics based on Niagara naming standard
  const t = blockType.toLowerCase();
  let jar = 'kitControl';
  let folder = 'control';
  let category = 'Control';
  let color = '#d97706';

  if (t.includes('writable') || t.includes('point') || t.includes('schedule') || t.includes('folder')) {
    jar = 'baja';
    folder = 'points';
    category = 'Points & Variables';
    color = '#4f46e5';
  } else if (
    t.includes('and') ||
    t.includes('or') ||
    t.includes('not') ||
    t.includes('xor') ||
    t.includes('equal') ||
    t.includes('greater') ||
    t.includes('less') ||
    t.includes('between')
  ) {
    jar = 'kitControl';
    folder = 'logic';
    category = 'Logic';
    color = '#0284c7';
  } else if (
    t.includes('add') ||
    t.includes('subtract') ||
    t.includes('multiply') ||
    t.includes('divide') ||
    t.includes('min') ||
    t.includes('max') ||
    t.includes('average') ||
    t.includes('abs')
  ) {
    jar = 'kitControl';
    folder = 'math';
    category = 'Math';
    color = '#059669';
  } else if (t.includes('delay') || t.includes('oneshot') || t.includes('pulse') || t.includes('timer') || t.includes('runtime')) {
    jar = 'kitControl';
    folder = 'timers';
    category = 'Timers';
    color = '#e11d48';
  } else if (t.includes('switch') || t.includes('demux') || t.includes('mux')) {
    jar = 'kitControl';
    folder = 'util';
    category = 'Switches & Conversion';
    color = '#0891b2';
  } else if (t.includes('alarm')) {
    jar = 'alarm';
    folder = 'alarm';
    category = 'Alarms';
    color = '#dc2626';
  }

  if (fallbackPalette) {
    const rawParts = fallbackPalette.split(':');
    if (rawParts.length === 2) {
      jar = rawParts[0];
      folder = rawParts[1];
    }
  }

  return {
    jarFile: `${jar}.jar`,
    folderPath: `${jar} > ${folder}`,
    componentName: blockType,
    category,
    workbenchPath: `Palette Window (Ctrl+L) → ${jar} → ${folder} → ${blockType}`,
    description: `Tridium Niagara ${blockType} component from ${jar} module`,
    color,
  };
}
