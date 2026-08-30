import React, { useRef, useState } from 'react';
import { Map, Minimize2 } from 'lucide-react';
import { NiagaraBlock, NiagaraLink } from '../types/niagara';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface WireSheetMinimapProps {
  blocks: NiagaraBlock[];
  links: NiagaraLink[];
  panOffset: { x: number; y: number };
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  onPanChange: (offset: { x: number; y: number }) => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
}

export const WireSheetMinimap: React.FC<WireSheetMinimapProps> = ({
  blocks,
  links,
  panOffset,
  zoom,
  containerWidth,
  containerHeight,
  onPanChange,
  selectedBlockId,
  onSelectBlock,
}) => {
  const { theme } = useNiagaraTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);

  if (blocks.length === 0) return null;

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        title="Expand Wire Sheet Minimap"
        className="absolute bottom-14 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-xl border backdrop-blur-md text-xs font-mono font-bold cursor-pointer transition-all bg-white hover:bg-slate-50 border-slate-300 text-sky-600"
      >
        <Map className="w-3.5 h-3.5" />
        <span>Minimap</span>
      </button>
    );
  }

  // Compute bounding box of all blocks
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  blocks.forEach((b) => {
    minX = Math.min(minX, b.x);
    maxX = Math.max(maxX, b.x + (b.width || 170));
    minY = Math.min(minY, b.y);
    maxY = Math.max(maxY, b.y + (b.height || 140));
  });

  // Add 150px margin
  minX -= 150;
  maxX += 150;
  minY -= 150;
  maxY += 150;

  const worldWidth = Math.max(800, maxX - minX);
  const worldHeight = Math.max(600, maxY - minY);

  const minimapWidth = 180;
  const minimapHeight = 120;

  const scaleX = minimapWidth / worldWidth;
  const scaleY = minimapHeight / worldHeight;
  const mapScale = Math.min(scaleX, scaleY);

  // Map world coords (x,y) to minimap coords
  const toMapX = (x: number) => (x - minX) * mapScale;
  const toMapY = (y: number) => (y - minY) * mapScale;

  // Current canvas viewport rect in world coordinates
  const viewWorldX = -panOffset.x / zoom;
  const viewWorldY = -panOffset.y / zoom;
  const viewWorldWidth = containerWidth / zoom;
  const viewWorldHeight = containerHeight / zoom;

  const viewRectX = toMapX(viewWorldX);
  const viewRectY = toMapY(viewWorldY);
  const viewRectW = viewWorldWidth * mapScale;
  const viewRectH = viewWorldHeight * mapScale;

  const updatePanFromPointer = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickMapX = e.clientX - rect.left;
    const clickMapY = e.clientY - rect.top;

    // Convert minimap coords back to world coords
    const clickWorldX = clickMapX / mapScale + minX;
    const clickWorldY = clickMapY / mapScale + minY;

    // Center viewport at click position
    const newPanX = -(clickWorldX - viewWorldWidth / 2) * zoom;
    const newPanY = -(clickWorldY - viewWorldHeight / 2) * zoom;

    onPanChange({ x: newPanX, y: newPanY });
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.stopPropagation();
    setIsDraggingViewport(true);
    updatePanFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingViewport) return;
    updatePanFromPointer(e);
  };

  const handlePointerUp = () => {
    setIsDraggingViewport(false);
  };

  return (
    <div
      className="absolute bottom-14 right-3 z-20 rounded-xl shadow-2xl border backdrop-blur-md overflow-hidden transition-all bg-white border-slate-300"
      style={{ width: minimapWidth, height: minimapHeight }}
    >
      <div className="absolute top-1 left-2 right-1.5 flex items-center justify-between z-10 pointer-events-auto">
        <span className="text-[9px] font-mono font-bold opacity-60 uppercase pointer-events-none text-slate-700">
          Wire Sheet Minimap
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(true);
          }}
          title="Minimize Minimap"
          className="p-0.5 rounded cursor-pointer transition-colors hover:bg-slate-100 text-slate-500 hover:text-slate-800"
        >
          <Minimize2 className="w-2.5 h-2.5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        width={minimapWidth}
        height={minimapHeight}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="cursor-crosshair w-full h-full select-none"
      >
        {/* Wire Links */}
        {(links || []).map((link) => {
          const fromB = (blocks || []).find((b) => b.id === link.fromBlockId);
          const toB = (blocks || []).find((b) => b.id === link.toBlockId);
          if (!fromB || !toB) return null;

          const x1 = toMapX(fromB.x + (fromB.width || 170));
          const y1 = toMapY(fromB.y + 40);
          const x2 = toMapX(toB.x);
          const y2 = toMapY(toB.y + 40);

          return (
            <line
              key={link.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#00529b"
              strokeWidth={1}
              strokeOpacity={0.6}
            />
          );
        })}

        {/* Node Rectangles */}
        {(blocks || []).map((block) => {
          const bx = toMapX(block.x);
          const by = toMapY(block.y);
          const bw = Math.max(4, (block.width || 170) * mapScale);
          const bh = Math.max(3, (block.height || 140) * mapScale);
          const isSelected = block.id === selectedBlockId;

          return (
            <rect
              key={block.id}
              x={bx}
              y={by}
              width={bw}
              height={bh}
              rx={1}
              fill={
                isSelected
                  ? '#44b33c'
                  : block.palette?.includes('points')
                  ? '#00529b'
                  : block.palette?.includes('control')
                  ? '#0284c7'
                  : '#cbd5e1'
              }
              stroke={isSelected ? '#ffffff' : '#94a3b8'}
              strokeWidth={0.5}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlock(block.id);
              }}
            />
          );
        })}

        {/* Viewport Box */}
        <rect
          x={viewRectX}
          y={viewRectY}
          width={Math.max(10, viewRectW)}
          height={Math.max(10, viewRectH)}
          fill="#38bdf8"
          fillOpacity={0.25}
          stroke="#0284c7"
          strokeWidth={1.5}
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
};
