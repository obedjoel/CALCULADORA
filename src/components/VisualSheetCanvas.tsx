import React, { useState, useEffect, useRef } from 'react';
import { CutLayoutResult, CutPiece } from '../types';
import { Ruler, Crop, Eye } from 'lucide-react';

interface VisualSheetCanvasProps {
  layout: CutLayoutResult;
  selectedPieceId: string | null;
  setSelectedPieceId: (id: string | null) => void;
  hoveredPiece: CutPiece | null;
  setHoveredPiece: (piece: CutPiece | null) => void;
}

export default function VisualSheetCanvas({
  layout,
  selectedPieceId,
  setSelectedPieceId,
  hoveredPiece,
  setHoveredPiece
}: VisualSheetCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 400 });
  const [showRulers, setShowRulers] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);

  // Resize monitor to keep the SVG container perfectly responsive
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observeTarget = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Keep a minimum height & width
        setDimensions({
          width: Math.max(300, width),
          height: Math.max(320, height - 40) // Leave small margin for controls
        });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, []);

  const { sheetWidth, sheetLength, pieces, layoutId } = layout;

  // Active inputs margin
  const marginOffset = (layout.totalArea - layout.usedArea) > 0 ? (sheetWidth - layout.effectiveSheetWidth) / 2 : 0;

  // Scale calculations
  const padding = 50; // Padding inside SVG canvas
  const canvasWidth = dimensions.width - padding * 2;
  const canvasHeight = dimensions.height - padding * 2;

  // Determine scale to fit sheet width & length inside the canvas space
  const scaleX = canvasWidth / sheetWidth;
  const scaleY = canvasHeight / sheetLength;
  const scale = Math.min(scaleX, scaleY, 12); // Maximum magnification capped at 12x

  // Scaled dimensions
  const svgWidth = sheetWidth * scale;
  const svgHeight = sheetLength * scale;

  // Center alignment in SVG
  const offsetX = (dimensions.width - svgWidth) / 2;
  const offsetY = (dimensions.height - svgHeight) / 2;

  // Generate ruler tick marks
  const tickInterval = sheetWidth > 120 || sheetLength > 120 ? 10 : 5; // cm
  const xTicks = Array.from({ length: Math.floor(sheetWidth / tickInterval) + 1 }, (_, i) => i * tickInterval);
  const yTicks = Array.from({ length: Math.floor(sheetLength / tickInterval) + 1 }, (_, i) => i * tickInterval);

  return (
    <div id="visual-canvas-container" className="flex flex-col bg-white border border-slate-200/60 rounded-3xl overflow-hidden h-full shadow-sm text-slate-800">
      {/* Header controls with modern Material styling */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-505 bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans">VISTA DE MODELACIÓN</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="toggle-rulers-btn"
            onClick={() => setShowRulers(!showRulers)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              showRulers ? 'bg-indigo-650 text-white border-indigo-650 shadow-sm' : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
            }`}
            title="Mostrar Reglas y Escala"
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>Regla</span>
          </button>
          
          <button
            id="toggle-coords-btn"
            onClick={() => setShowCoordinates(!showCoordinates)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              showCoordinates ? 'bg-indigo-650 text-white border-indigo-650 shadow-sm' : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
            }`}
            title="Mostrar Cotas de Posición"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Cotas</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Workspace with Workspace tint */}
      <div 
        ref={containerRef} 
        className="relative flex-1 bg-[#f0f4f9] flex items-center justify-center overflow-hidden min-h-[350px] cursor-crosshair select-none border-b border-slate-150"
      >
        <svg 
          id="sheet-svg-canvas"
          width={dimensions.width} 
          height={dimensions.height}
          className="w-full h-full"
        >
          <defs>
            {/* Grid Pattern for the Table Base */}
            <pattern id="benchGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="transparent" />
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(99,102,241,0.04)" strokeWidth="1" />
            </pattern>
            
            {/* Diagonal Striped Pattern for Waste / Non-utilizable Border Margin spaces */}
            <pattern id="wasteHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" style={{ stroke: '#6366f1', strokeWidth: 1.5, opacity: 0.12 }} />
            </pattern>

            {/* Alternating hatch pattern for unutilized strips inside */}
            <pattern id="emptySpaceHatch" width="10" height="10" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" style={{ stroke: '#475569', strokeWidth: 1.2, opacity: 0.08 }} />
            </pattern>
          </defs>

          {/* Background Steel Grid representing cutting table */}
          <rect width="100%" height="100%" fill="url(#benchGrid)" />

          {/* Canvas center content group */}
          <g transform={`translate(${offsetX}, ${offsetY})`}>
            
            {/* LARGE SHEET (PLIEGO) OUTLINE */}
            {/* Draw shadowing for realism */}
            <rect
              id="sheet-shading"
              x={2}
              y={2}
              width={svgWidth}
              height={svgHeight}
              rx={3}
              ry={3}
              fill="rgba(15,23,42,0.06)"
            />
            
            {/* Pliego base rectangle */}
            <rect
              id="sheet-base-rect"
              x={0}
              y={0}
              width={svgWidth}
              height={svgHeight}
              rx={2}
              ry={2}
              fill="#ffffff"
              stroke="#64748b"
              strokeWidth={1.5}
            />

            {/* If margin exists, visual indicator of printable/cuttable area */}
            {marginOffset > 0 && (
              <>
                {/* Waste-patterned border zone */}
                <rect
                  id="margin-waste-rect"
                  x={0}
                  y={0}
                  width={svgWidth}
                  height={svgHeight}
                  fill="url(#wasteHatch)"
                />
                
                {/* Printable core region */}
                <rect
                  id="printable-core-rect"
                  x={marginOffset * scale}
                  y={marginOffset * scale}
                  width={(sheetWidth - 2 * marginOffset) * scale}
                  height={(sheetLength - 2 * marginOffset) * scale}
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeDasharray="4,4"
                  strokeWidth={1}
                />
              </>
            )}

            {/* If no margins, fill the whole sheet with white */}
            {marginOffset <= 0 && (
              <rect
                id="white-core"
                x={0}
                y={0}
                width={svgWidth}
                height={svgHeight}
                fill="#ffffff"
              />
            )}

            {/* Hatching for inner empty/waste paper pockets */}
            {layoutId !== 'empty' && (
              <rect
                id="empty-inner-hatch"
                x={marginOffset * scale}
                y={marginOffset * scale}
                width={(sheetWidth - 2 * marginOffset) * scale}
                height={(sheetLength - 2 * marginOffset) * scale}
                fill="url(#emptySpaceHatch)"
                pointerEvents="none"
              />
            )}

            {/* RENDER MEASUREMENT TICK TICKS ON RULERS */}
            {showRulers && (
              <g id="ruler-ticks" className="text-[9px] font-mono fill-slate-500 font-semibold select-none">
                {/* Top Ruler Numbers & Ticks */}
                {xTicks.map((tick) => (
                  <g key={`xtick-${tick}`} transform={`translate(${tick * scale}, 0)`}>
                    <line x1={0} y1={-8} x2={0} y2={0} stroke="#cbd5e1" strokeWidth={1} />
                    {tick > 0 && tick < sheetWidth && (
                      <text x={0} y={-11} textAnchor="middle" className="fill-slate-500">
                        {tick}
                      </text>
                    )}
                  </g>
                ))}
                
                {/* Left Ruler Numbers & Ticks */}
                {yTicks.map((tick) => (
                  <g key={`ytick-${tick}`} transform={`translate(0, ${tick * scale})`}>
                    <line x1={-8} y1={0} x2={0} y2={0} stroke="#cbd5e1" strokeWidth={1} />
                    {tick > 0 && tick < sheetLength && (
                      <text x={-11} y={3} textAnchor="end" className="fill-slate-500">
                        {tick}
                      </text>
                    )}
                  </g>
                ))}

                {/* Overall Dimension labels */}
                {/* Width Label on top */}
                <text x={svgWidth / 2} y={-24} textAnchor="middle" className="fill-slate-600 font-bold uppercase text-[9.5px] tracking-widest leading-none">
                  ANCHO PLIEGO: {sheetWidth} cm
                </text>
                {/* Height/Length Label on left */}
                <text 
                  x={-28} 
                  y={svgHeight / 2} 
                  textAnchor="middle" 
                  transform={`rotate(-90, -28, ${svgHeight / 2})`}
                  className="fill-slate-600 font-bold uppercase text-[9.5px] tracking-widest leading-none"
                >
                  LARGO PLIEGO: {sheetLength} cm
                </text>
              </g>
            )}

            {/* RENDER CUT PIECES IN POSITION */}
            {layoutId !== 'empty' && pieces.length > 0 ? (
              <g id="cut-pieces">
                {pieces.map((piece, index) => {
                  const isHovered = hoveredPiece?.id === piece.id;
                  const isSelected = selectedPieceId === piece.id;
                  
                  return (
                    <g 
                      key={piece.id}
                      onMouseEnter={() => setHoveredPiece(piece)}
                      onMouseLeave={() => setHoveredPiece(null)}
                      onClick={() => setSelectedPieceId(isSelected ? null : piece.id)}
                      className="cursor-pointer group"
                    >
                      {/* Piece Body */}
                      <rect
                        id={`piece-rect-${piece.id}`}
                        x={piece.x * scale}
                        y={piece.y * scale}
                        width={piece.width * scale}
                        height={piece.height * scale}
                        rx={2}
                        ry={2}
                        className={`transition-all duration-100 ${
                          isSelected
                            ? 'fill-indigo-100 stroke-indigo-600'
                            : isHovered
                            ? 'fill-indigo-50 stroke-indigo-500'
                            : piece.isRotated
                            ? 'fill-emerald-50/80 stroke-emerald-400 hover:fill-emerald-100/80'
                            : 'fill-white stroke-slate-300 hover:fill-slate-50/50'
                        }`}
                        strokeWidth={isSelected ? 2 : 1.2}
                      />

                      {/* Rotated Angle Watermark in corners of rotated pieces */}
                      {piece.isRotated && piece.width * scale > 18 && piece.height * scale > 18 && (
                        <path
                          d={`M ${(piece.x + piece.width) * scale - 12} ${piece.y * scale + 4} L ${(piece.x + piece.width) * scale - 4} ${piece.y * scale + 4} L ${(piece.x + piece.width) * scale - 4} ${piece.y * scale + 12}`}
                          fill="none"
                          className="stroke-emerald-600"
                          strokeWidth={2}
                        />
                      )}

                      {/* Piece Index Text/Badge (Only render if piece size fits text) */}
                      {piece.width * scale > 24 && piece.height * scale > 16 ? (
                        <text
                          id={`piece-label-${piece.id}`}
                          x={(piece.x + piece.width / 2) * scale}
                          y={(piece.y + piece.height / 2) * scale + 3}
                          textAnchor="middle"
                          className={`text-[9.5px] font-mono font-semibold pointer-events-none select-none uppercase ${
                            isSelected ? 'fill-indigo-950 font-bold' : piece.isRotated ? 'fill-emerald-800' : 'fill-slate-700'
                          }`}
                        >
                          {index + 1}
                          {piece.isRotated && '⟳'}
                        </text>
                      ) : null}

                      {/* Coordinates (Cotas) overlay when piece is selected/hovered */}
                      {showCoordinates && (isSelected || isHovered) && (
                        <g className="pointer-events-none text-[8.5px] font-mono">
                          {/* Width Label of piece */}
                          <rect
                            x={(piece.x + piece.width / 2) * scale - 22}
                            y={piece.y * scale + 3}
                            width={44}
                            height={13}
                            rx={4}
                            fill="#1e293b"
                          />
                          <text
                            x={(piece.x + piece.width / 2) * scale}
                            y={piece.y * scale + 12}
                            textAnchor="middle"
                            className="fill-white font-bold"
                          >
                            {piece.width}cm
                          </text>

                          {/* Height/Length Label of piece */}
                          <rect
                            x={piece.x * scale + 3}
                            y={(piece.y + piece.height / 2) * scale - 6}
                            width={44}
                            height={13}
                            rx={4}
                            fill="#1e293b"
                          />
                          <text
                            x={piece.x * scale + 25}
                            y={(piece.y + piece.height / 2) * scale + 4}
                            textAnchor="middle"
                            className="fill-white font-bold"
                          >
                            {piece.height}cm
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            ) : (
              // Empty notification when sheet doesn't fit anything
              <g transform={`translate(${svgWidth / 2}, ${svgHeight / 2})`}>
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  className="fill-rose-500 font-display font-bold text-xs uppercase text-center"
                >
                  ¡Las piezas no caben!
                </text>
                <text
                  x={0}
                  y={13}
                  textAnchor="middle"
                  className="fill-slate-500 font-medium text-[9.5px]"
                >
                  Revise las dimensiones o márgenes.
                </text>
              </g>
            )}

            {/* DYNAMIC GUILLOTINE HOVER PROJECT LINES */}
            {hoveredPiece && (
              <g id="guillotine-guides" className="pointer-events-none opacity-90">
                {/* Horizontal Guillotine Project Cuts */}
                <line
                  id="guide-h-top"
                  x1={-12}
                  y1={hoveredPiece.y * scale}
                  x2={svgWidth}
                  y2={hoveredPiece.y * scale}
                  stroke="#f43f5e"
                  strokeDasharray="3,3"
                  strokeWidth={1.5}
                />
                <line
                  id="guide-h-bottom"
                  x1={-12}
                  y1={(hoveredPiece.y + hoveredPiece.height) * scale}
                  x2={svgWidth}
                  y2={(hoveredPiece.y + hoveredPiece.height) * scale}
                  stroke="#f43f5e"
                  strokeDasharray="3,3"
                  strokeWidth={1.5}
                />
                
                {/* Vertical Guillotine Project Cuts */}
                <line
                  id="guide-v-left"
                  x1={hoveredPiece.x * scale}
                  y1={-12}
                  x2={hoveredPiece.x * scale}
                  y2={svgHeight}
                  stroke="#f43f5e"
                  strokeDasharray="3,3"
                  strokeWidth={1.5}
                />
                <line
                  id="guide-v-right"
                  x1={(hoveredPiece.x + hoveredPiece.width) * scale}
                  y1={-12}
                  x2={(hoveredPiece.x + hoveredPiece.width) * scale}
                  y2={svgHeight}
                  stroke="#f43f5e"
                  strokeDasharray="3,3"
                  strokeWidth={1.5}
                />

                {/* Left Ruler projection values */}
                <rect
                  x={-42}
                  y={hoveredPiece.y * scale - 7}
                  width={28}
                  height={14}
                  rx={4}
                  fill="#f43f5e"
                />
                <text
                  x={-28}
                  y={hoveredPiece.y * scale + 3}
                  textAnchor="middle"
                  className="fill-white font-mono text-[9px] font-bold"
                >
                  {hoveredPiece.y.toFixed(0)}
                </text>

                <rect
                  x={-42}
                  y={(hoveredPiece.y + hoveredPiece.height) * scale - 7}
                  width={28}
                  height={14}
                  rx={4}
                  fill="#f43f5e"
                />
                <text
                  x={-28}
                  y={(hoveredPiece.y + hoveredPiece.height) * scale + 3}
                  textAnchor="middle"
                  className="fill-white font-mono text-[9px] font-bold"
                >
                  {(hoveredPiece.y + hoveredPiece.height).toFixed(0)}
                </text>

                {/* Top Ruler projection values */}
                <rect
                  x={hoveredPiece.x * scale - 14}
                  y={-28}
                  width={28}
                  height={14}
                  rx={4}
                  fill="#f43f5e"
                />
                <text
                  x={hoveredPiece.x * scale}
                  y={-18}
                  textAnchor="middle"
                  className="fill-white font-mono text-[9px] font-bold"
                >
                  {hoveredPiece.x.toFixed(0)}
                </text>

                <rect
                  x={(hoveredPiece.x + hoveredPiece.width) * scale - 14}
                  y={-28}
                  width={28}
                  height={14}
                  rx={4}
                  fill="#f43f5e"
                />
                <text
                  x={(hoveredPiece.x + hoveredPiece.width) * scale}
                  y={-18}
                  textAnchor="middle"
                  className="fill-white font-mono text-[9px] font-bold"
                >
                  {(hoveredPiece.x + hoveredPiece.width).toFixed(0)}
                </text>
              </g>
            )}

          </g>
        </svg>

        {/* Dynamic Tooltip inside Canvas for hovered element */}
        {hoveredPiece && (
          <div className="absolute bottom-4 left-4 bg-slate-900 border border-slate-800 text-[11.5px] font-mono text-slate-300 px-4 py-3 rounded-2xl shadow-lg pointer-events-none z-10 min-w-[200px]">
            <div className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider mb-1 text-[10px]">
              <Crop className="h-3 w-3 text-indigo-400" />
              <span>CORTES DETALLE</span>
            </div>
            <div>Posición: X = <span className="font-bold text-slate-100">{hoveredPiece.x.toFixed(1)} cm</span>, Y = <span className="font-bold text-slate-100">{hoveredPiece.y.toFixed(1)} cm</span></div>
            <div>Tamaño: <span className="font-bold text-slate-100">{hoveredPiece.width} × {hoveredPiece.height} cm</span> {hoveredPiece.isRotated && <span className="text-emerald-400 font-bold">(Rotada)</span>}</div>
            <div className="text-[9px] text-slate-500 italic mt-1 leading-none">Ejes de guillotina en rojo.</div>
          </div>
        )}
      </div>

      {/* Footer Details showing legends */}
      <div className="bg-slate-50/55 px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 font-medium">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-slate-300 bg-white inline-block shadow-sm" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">DIRECTA ({sheetWidth > 0 && pieces.filter(p => !p.isRotated).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-emerald-300 bg-emerald-50 inline-block shadow-sm" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">ROTADA 90° ({sheetWidth > 0 && pieces.filter(p => p.isRotated).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-dashed border-slate-400 bg-[#f8fafc] inline-block" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">REFILE MARGEN</span>
          </div>
        </div>

        <div className="text-slate-400 text-[10px] font-mono font-semibold uppercase tracking-widest select-none">
          ESCALA: {scale.toFixed(2)}X (AUTOFIT)
        </div>
      </div>
    </div>
  );
}
