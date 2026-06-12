import React from 'react';
import { PRESETS_PLIEGOS, PRESETS_PIEZAS } from '../utils/optimizer';
import { SizePreset } from '../types';
import { Layers, Crop, LayoutGrid, Zap } from 'lucide-react';

interface PresetBarProps {
  onSelectSheetPreset: (preset: SizePreset) => void;
  onSelectPiecePreset: (preset: SizePreset) => void;
  activeSheetName: string;
  activePieceName: string;
}

export default function PresetBar({
  onSelectSheetPreset,
  onSelectPiecePreset,
  activeSheetName,
  activePieceName
}: PresetBarProps) {
  return (
    <div id="presets-panel" className="bg-white border-4 border-black rounded-none p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b-4 border-black">
        <Zap className="h-5 w-5 text-black" fill="#EFFF00" />
        <h3 className="text-base font-black text-black uppercase tracking-tighter font-display">
          MEDIDAS PREDETERMINADAS (FAVORITOS DE IMPRENTA)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pliego Presets */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.25em] flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-black" />
            FORMATOS DE PLIEGO PADRÓN (W x L)
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS_PLIEGOS.map((p) => {
              const isActive = activeSheetName === p.name || 
                (p.id === 'p-61-86' && activeSheetName === '61 x 86 cm') || 
                (p.id === 'p-70-100' && activeSheetName === '70 x 100 cm');

              return (
                <button
                  key={p.id}
                  id={`preset-sheet-${p.id}`}
                  onClick={() => onSelectSheetPreset(p)}
                  className={`px-3 py-2 rounded-none text-xs text-left cursor-pointer border-2 border-black font-bold transition-all ${
                    isActive
                      ? 'bg-[#EFFF00] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-neutral-100 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                  title={p.description}
                >
                  <div className="font-extrabold block uppercase tracking-tight">{p.name}</div>
                  <div className={`text-[10px] font-mono ${isActive ? 'text-black/80' : 'text-neutral-500'}`}>
                    {p.width} x {p.length} cm
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Piece Presets */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.25em] flex items-center gap-1.5">
            <Crop className="h-4 w-4 text-black" />
            MEDIDAS DE LA PIEZA FINAL O VOLANTE
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS_PIEZAS.map((p) => {
              const isActive = activePieceName === p.name;
              return (
                <button
                  key={p.id}
                  id={`preset-piece-${p.id}`}
                  onClick={() => onSelectPiecePreset(p)}
                  className={`px-3 py-2 rounded-none text-xs text-left cursor-pointer border-2 border-black font-bold transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                      : 'bg-white hover:bg-neutral-100 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                  title={p.description}
                >
                  <div className="font-extrabold block uppercase tracking-tight">{p.name}</div>
                  <div className={`text-[10px] font-mono ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {p.width} x {p.length} cm
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
