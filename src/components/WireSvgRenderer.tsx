import React from 'react';
import { NiagaraLink, NiagaraBlock } from '../types/niagara';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface WireSvgRendererProps {
  links: NiagaraLink[];
  blocks: NiagaraBlock[];
  activeLinkIds: Set<string>;
  selectedLinkId: string | null;
  onSelectLink: (linkId: string | null) => void;
  onDeleteLink: (linkId: string) => void;
  onContextMenuLink?: (e: React.MouseEvent, link: NiagaraLink) => void;
  tempWire: {
    fromBlockId: string;
    fromSlot: string;
    fromKind: 'output' | 'input';
    fromDataType?: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
  zoom: number;
}

export const WireSvgRenderer: React.FC<WireSvgRendererProps> = ({
  links,
  blocks,
  activeLinkIds,
  selectedLinkId,
  onSelectLink,
  onDeleteLink,
  onContextMenuLink,
  tempWire,
}) => {
  const { wireRouting, animateSignalFlow, colorCodedWires } = useNiagaraTheme();
  // Helper to calculate exact (x, y) coordinates of a slot on a block
  const getSlotCoordinates = (
    blockId: string,
    slotName: string,
    isInput: boolean
  ): { x: number; y: number } | null => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return null;

    const blockWidth = block.width || 220;
    const headerHeight = 36;
    const slotRowHeight = 22;

    const blockInputs = block.inputs || [];
    const blockOutputs = block.outputs || [];

    if (isInput) {
      const slotIndex = blockInputs.findIndex((inp) => inp.name === slotName);
      const safeIndex = slotIndex >= 0 ? slotIndex : 0;
      const overallIndex = blockOutputs.length + safeIndex;
      const x = block.x; // Left edge
      const y = block.y + headerHeight + overallIndex * slotRowHeight + (slotRowHeight / 2);
      return { x, y };
    } else {
      const slotIndex = blockOutputs.findIndex((out) => out.name === slotName);
      const safeIndex = slotIndex >= 0 ? slotIndex : 0;
      const overallIndex = safeIndex;
      const x = block.x + blockWidth; // Right edge
      const y = block.y + headerHeight + overallIndex * slotRowHeight + (slotRowHeight / 2);
      return { x, y };
    }
  };

  // Generate smooth cubic bezier SVG path between source (output) and target (input)
  const createBezierPath = (x1: number, y1: number, x2: number, y2: number, fromKind: 'output' | 'input' = 'output') => {
    const dx = Math.abs(x2 - x1);
    const controlDist = Math.max(40, dx * 0.5);

    if (fromKind === 'output') {
      const cp1x = x1 + controlDist;
      const cp1y = y1;
      const cp2x = x2 - controlDist;
      const cp2y = y2;
      return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    } else {
      // Started from input, moving to output
      const cp1x = x1 - controlDist;
      const cp1y = y1;
      const cp2x = x2 + controlDist;
      const cp2y = y2;
      return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }
  };

  // Generate clean orthogonal Manhattan path with rounded corners
  const createManhattanPath = (x1: number, y1: number, x2: number, y2: number) => {
    const midX = x1 + (x2 - x1) * 0.5;
    const r = 8; // corner rounding radius
    const isUp = y2 < y1;
    const isRight = x2 > x1;

    if (Math.abs(x2 - x1) < r * 2 || Math.abs(y2 - y1) < r * 2) {
      // Fallback to straight segments if targets are too close
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }

    const r1x = midX - (isRight ? r : -r);
    const r1y = y1;
    const r2x = midX;
    const r2y = y1 + (isUp ? -r : r);

    const r3x = midX;
    const r3y = y2 + (isUp ? r : -r);
    const r4x = midX + (isRight ? r : -r);
    const r5y = y2;

    const sweep1 = (isRight ? 1 : 0) ^ (isUp ? 1 : 0) ? 0 : 1;
    const sweep2 = (isRight ? 1 : 0) ^ (isUp ? 1 : 0) ? 1 : 0;

    return `M ${x1} ${y1} L ${r1x} ${r1y} A ${r} ${r} 0 0 ${sweep1} ${r2x} ${r2y} L ${r3x} ${r3y} A ${r} ${r} 0 0 ${sweep2} ${r4x} ${r5y} L ${x2} ${y2}`;
  };

  const getPathData = (x1: number, y1: number, x2: number, y2: number, fromKind: 'output' | 'input' = 'output') => {
    if (wireRouting === 'manhattan') {
      return createManhattanPath(x1, y1, x2, y2);
    }
    return createBezierPath(x1, y1, x2, y2, fromKind);
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        {/* Standard Wire Arrow Marker */}
        <marker
          id="wire-arrow-gray"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
        </marker>

        <marker
          id="wire-arrow-green"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
        </marker>

        <marker
          id="wire-arrow-purple"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
        </marker>

        <marker
          id="wire-arrow-orange"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
        </marker>

        {/* Active Signal Arrow Marker */}
        <marker
          id="wire-arrow-active"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
        </marker>

        {/* Selected Arrow Marker */}
        <marker
          id="wire-arrow-selected"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
        </marker>
      </defs>

      {/* Render Established Niagara Wire Links */}
      {(links || []).map((link) => {
        const fromCoords = getSlotCoordinates(link.fromBlockId, link.fromSlot, false);
        const toCoords = getSlotCoordinates(link.toBlockId, link.toSlot, true);

        if (!fromCoords || !toCoords) return null;

        const pathData = getPathData(
          fromCoords.x,
          fromCoords.y,
          toCoords.x,
          toCoords.y,
          'output'
        );

        const isActive = activeLinkIds.has(link.id);
        const isSelected = selectedLinkId === link.id;
        const midX = (fromCoords.x + toCoords.x) / 2;
        const midY = (fromCoords.y + toCoords.y) / 2;

        const sig = (link.signalType || 'boolean').toLowerCase();
        let wireBaseColor = '#64748b'; // medium grey default
        let markerId = 'url(#wire-arrow-gray)';

        if (colorCodedWires) {
          if (sig === 'boolean') {
            wireBaseColor = '#10b981'; // Green for boolean
            markerId = 'url(#wire-arrow-green)';
          } else if (sig === 'numeric' || sig === 'double') {
            wireBaseColor = '#a855f7'; // Purple for numeric
            markerId = 'url(#wire-arrow-purple)';
          } else if (sig === 'enum') {
            wireBaseColor = '#f97316'; // Orange for enum
            markerId = 'url(#wire-arrow-orange)';
          }
        }

        const strokeColor = isSelected ? '#ef4444' : isActive ? '#38bdf8' : wireBaseColor;
        const finalMarker = isSelected
          ? 'url(#wire-arrow-selected)'
          : isActive
          ? 'url(#wire-arrow-active)'
          : markerId;

        return (
          <g
            key={link.id}
            data-link-id={link.id}
            data-from-block={link.fromBlockId}
            data-to-block={link.toBlockId}
            className="pointer-events-auto group"
          >
            {/* Fat Invisible Path for Easy Click & Touch Selection */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth={28}
              data-link-id={link.id}
              data-from-block={link.fromBlockId}
              data-to-block={link.toBlockId}
              className="cursor-pointer pointer-events-auto"
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelectLink(link.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLink(link.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectLink(link.id);
                onContextMenuLink?.(e, link);
              }}
            />

            {/* Background Glow when Active / Pulsing */}
            {isActive && (
              <path
                d={pathData}
                fill="none"
                stroke={wireBaseColor}
                strokeWidth={7}
                strokeOpacity={0.4}
                className="animate-pulse pointer-events-none"
              />
            )}

            {/* Main Visual Niagara Wire Path: Thick black outer outline for realistic physical cable effect */}
            <path
              d={pathData}
              fill="none"
              stroke="#000000"
              strokeWidth={isSelected ? 5.5 : isActive ? 4.5 : 3.8}
              className="transition-all pointer-events-none"
            />

            {/* Main Visual Niagara Wire Path: Colored inner core */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isSelected ? 3.5 : isActive ? 2.5 : 1.8}
              className="transition-colors pointer-events-none"
              markerEnd={finalMarker}
            />

            {/* Overlay animated flows representing live signal transmissions */}
            {animateSignalFlow && !isSelected && (
              <path
                d={pathData}
                fill="none"
                stroke={isActive ? '#38bdf8' : (colorCodedWires ? wireBaseColor : '#ffffff')}
                strokeWidth={isActive ? 1.5 : 1.0}
                strokeOpacity={isActive ? 1 : 0.75}
                className={`pointer-events-none ${
                  isActive
                    ? 'animate-wire-flow-alarm'
                    : sig === 'numeric' || sig === 'double'
                    ? 'animate-wire-flow-fast'
                    : 'animate-wire-flow'
                }`}
              />
            )}

            {/* Delete Wire Handle (Visible when link is selected) */}
            {isSelected && (
              <g
                transform={`translate(${midX}, ${midY})`}
                className="cursor-pointer pointer-events-auto transition-all scale-110 opacity-100"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onDeleteLink(link.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLink(link.id);
                }}
              >
                <rect
                  x={-42}
                  y={-14}
                  width={84}
                  height={28}
                  rx={14}
                  fill="#dc2626"
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="shadow-lg hover:fill-red-700"
                />
                <text
                  x={0}
                  y={4}
                  fill="#ffffff"
                  fontSize={11}
                  fontWeight="bold"
                  textAnchor="middle"
                  className="select-none pointer-events-none font-sans"
                >
                  ✕ DELETE
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Temporary In-Progress Wire while Dragging or Clicking to Wire */}
      {tempWire && (
        <g className="pointer-events-none">
          <path
            d={createBezierPath(
              tempWire.startX,
              tempWire.startY,
              tempWire.currentX,
              tempWire.currentY,
              tempWire.fromKind
            )}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth={3}
            strokeDasharray="5,4"
            markerEnd="url(#wire-arrow-active)"
            className="animate-pulse pointer-events-none"
          />
          <circle
            cx={tempWire.startX}
            cy={tempWire.startY}
            r={5}
            fill="#0ea5e9"
            className="animate-ping pointer-events-none"
          />
          <circle
            cx={tempWire.currentX}
            cy={tempWire.currentY}
            r={5}
            fill="#38bdf8"
            className="pointer-events-none"
          />
        </g>
      )}
    </svg>
  );
};
