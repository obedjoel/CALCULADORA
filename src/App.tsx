import React, { useState, useMemo } from 'react';
import { PaperCutterInputs, CutPiece, CutLayoutResult } from './types';
import { calculateLayouts } from './utils/optimizer';
import {
  Scissors,
  Layers,
  Crop,
  Calculator,
  Sparkles,
  Settings
} from 'lucide-react';

interface StandardFormatOption {
  id: string;
  name: string;
  label: string;
  fraction: string;
  yieldPerSheet: number;
  width: number;
  length: number;
  description: string;
}

// Subdivisions of a 61 x 86 cm pliego correcting official DIN A series alignment
const STANDARD_FORMATS: StandardFormatOption[] = [
  {
    id: 'a7',
    name: 'A7',
    label: '1/64 Pliego',
    fraction: '1/64',
    yieldPerSheet: 64,
    width: 7.625,
    length: 10.75,
    description: 'Micro folleto / Etiqueta (7.6 x 10.7 cm)'
  },
  {
    id: 'a6',
    name: 'A6',
    label: '1/32 Pliego',
    fraction: '1/32',
    yieldPerSheet: 32,
    width: 10.75,
    length: 15.25,
    description: 'Folleto de bolsillo (10.7 x 15.2 cm)'
  },
  {
    id: 'a5',
    name: 'A5',
    label: '1/16 Pliego',
    fraction: '1/16',
    yieldPerSheet: 16,
    width: 15.25,
    length: 21.5,
    description: 'Folleto estándar (15.2 x 21.5 cm)'
  },
  {
    id: 'a4',
    name: 'A4',
    label: '1/8 Pliego',
    fraction: '1/8',
    yieldPerSheet: 8,
    width: 21.5,
    length: 30.5,
    description: 'Volante / Medio oficio (21.5 x 30.5 cm)'
  },
  {
    id: 'a3',
    name: 'A3',
    label: '1/4 Pliego',
    fraction: '1/4',
    yieldPerSheet: 4,
    width: 30.5,
    length: 43.0,
    description: 'Folleto grande (30.5 x 43.0 cm)'
  },
  {
    id: 'a2',
    name: 'A2',
    label: '1/2 Pliego',
    fraction: '1/2',
    yieldPerSheet: 2,
    width: 43.0,
    length: 61.0,
    description: 'Afiche pequeño (43.0 x 61.0 cm)'
  },
  {
    id: 'a1',
    name: 'A1',
    label: '1 Pliego Completo',
    fraction: '1/1',
    yieldPerSheet: 1,
    width: 61.0,
    length: 86.0,
    description: 'Afiche grande (61.0 x 86.0 cm)'
  }
];

export default function App() {
  // Format selection state
  const [selectedFormatId, setSelectedFormatId] = useState<string>('a5'); // Default to A5 (yielding 16, size 15.25 x 21.5 cm)
  
  // Custom tracking for target work details
  const [targetQuantity, setTargetQuantity] = useState<number>(1000); // Default to 1000
  const [wastePercentage, setWastePercentage] = useState<number>(5); // Default to 5%
  
  // Custom dimensions inputs (only active when custom is selected)
  const [customWidth, setCustomWidth] = useState<string>('12');
  const [customLength, setCustomLength] = useState<string>('12');
  
  // Toggle for showing advanced settings (like margin and gutter for custom pieces)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [sheetMargin, setSheetMargin] = useState<number>(0); // Default 0 for clean division
  const [pieceGutter, setPieceGutter] = useState<number>(0); // Default 0
  const [fiberDirection, setFiberDirection] = useState<'any' | 'with-width' | 'with-length'>('any');

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [hoveredPiece, setHoveredPiece] = useState<CutPiece | null>(null);

  // Check if we are running standard or custom formats
  const isCustomMode = selectedFormatId === 'custom';

  // Compute inputs for the layout calculation engine
  const calculatedInputs = useMemo<PaperCutterInputs>(() => {
    let pieceWidth = 15.25;
    let pieceLength = 21.5;

    if (isCustomMode) {
      const parsedW = parseFloat(customWidth);
      const parsedL = parseFloat(customLength);
      pieceWidth = isNaN(parsedW) || parsedW <= 0 ? 10 : parsedW;
      pieceLength = isNaN(parsedL) || parsedL <= 0 ? 10 : parsedL;
    } else {
      const match = STANDARD_FORMATS.find(f => f.id === selectedFormatId);
      if (match) {
        pieceWidth = match.width;
        pieceLength = match.length;
      }
    }

    return {
      sheetWidth: 61, // Locked at 61 cm
      sheetLength: 86, // Locked at 86 cm
      pieceWidth,
      pieceLength,
      sheetMargin: isCustomMode ? sheetMargin : 0, // Clean cut divisions require 0 margin
      pieceGutter: isCustomMode ? pieceGutter : 0, // Clean cut divisions require 0 gutter
      targetQuantity,
      wastePercentage,
      fiberDirection: isCustomMode ? fiberDirection : 'any'
    };
  }, [
    isCustomMode,
    selectedFormatId,
    customWidth,
    customLength,
    sheetMargin,
    pieceGutter,
    targetQuantity,
    wastePercentage,
    fiberDirection
  ]);

  // Execute optimal packing engine
  const layoutResults = useMemo(() => {
    return calculateLayouts(calculatedInputs);
  }, [calculatedInputs]);

  // Read current active layout configuration
  const activeLayout = useMemo<CutLayoutResult>(() => {
    if (layoutResults.length === 0) {
      return {
        layoutId: 'empty',
        name: 'Sin Ajuste posible',
        description: 'La pieza ingresada supera las dimensiones útiles del pliego.',
        piecesPerSheet: 0,
        pieces: [],
        sheetWidth: 61,
        sheetLength: 86,
        effectiveSheetWidth: 61,
        effectiveSheetLength: 86,
        usedArea: 0,
        totalArea: 5246,
        efficiency: 0,
        totalSheetsNeeded: 0,
        totalSheetsWithWaste: 0,
        wasteAreaPercentage: 100,
        orientationUsed: 'Ninguna'
      };
    }
    
    // For standard fractional subdivisions, force the exact math pieces per sheet to prevent rounding differences!
    const current = layoutResults[0];
    if (!isCustomMode) {
      const match = STANDARD_FORMATS.find(f => f.id === selectedFormatId);
      if (match) {
        // Enforce layout totals exactly matching standard presets
        const netSheets = Math.ceil(targetQuantity / match.yieldPerSheet);
        const sheetsWithWaste = Math.ceil(netSheets * (1 + wastePercentage / 100));
        return {
          ...current,
          piecesPerSheet: match.yieldPerSheet,
          totalSheetsNeeded: netSheets,
          totalSheetsWithWaste: sheetsWithWaste,
          efficiency: (match.yieldPerSheet * (match.width * match.length) / 5246) * 100,
          wasteAreaPercentage: 100 - ((match.yieldPerSheet * (match.width * match.length) / 5246) * 100)
        };
      }
    }
    return current;
  }, [layoutResults, isCustomMode, selectedFormatId, targetQuantity, wastePercentage]);

  // Quick helper to format standard number
  const formatNumber = (num: number) => {
    return isNaN(num) ? '0' : num.toString();
  };

  // Switch size selection directly
  const handleSelectFormat = (formatId: string) => {
    setSelectedFormatId(formatId);
    setSelectedPieceId(null);
    setHoveredPiece(null);
  };

  const currentFormatDetails = useMemo(() => {
    if (isCustomMode) {
      return {
        name: 'Medida Personalizada',
        dimensions: `${customWidth} x ${customLength} cm`,
        yieldDesc: `${activeLayout.piecesPerSheet} piezas caben por pliego`
      };
    }
    const match = STANDARD_FORMATS.find(f => f.id === selectedFormatId);
    return match ? {
      name: `${match.name} (${match.fraction} Pliego)`,
      dimensions: `${match.width} x ${match.length} cm`,
      yieldDesc: `Entran exactamente ${match.yieldPerSheet} por pliego`
    } : null;
  }, [selectedFormatId, isCustomMode, customWidth, customLength, activeLayout.piecesPerSheet]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-800 pb-16 antialiased selection:bg-indigo-100 selection:text-indigo-900 print:bg-white print:text-black print:pb-0 font-sans">
      
      {/* HEADER SECTION */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 print:relative print:border-none print:shadow-none shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl flex items-center justify-center shadow-sm shadow-indigo-100">
              <Scissors className="h-5 w-5 stroke-[2.5]" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight leading-none font-display">
              Calculadora de Corte y Pliegos
            </h1>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE LIMIT */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 mt-6">

        {/* SINGLE COLUMN BLOCK */}
        <div className="space-y-6 print:hidden">
          
          {/* MAIN CONTAINER: FORMATS SELECTOR & WORK OPTIONS */}
          <div className="space-y-6">
            
            {/* INPUTS CONTROL CONTAINER */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50 space-y-6 text-slate-800">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans">
                    PANEL DE AJUSTES
                  </h3>
                </div>
              </div>

              {/* SECTION: FORMAT SELECTOR */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  FORMATO DE LA PIEZA FINAL
                </label>
                
                {/* Regular Pre-defined formats list */}
                <div className="flex flex-col gap-1.5">
                  {STANDARD_FORMATS.map((col) => {
                    const isSelected = selectedFormatId === col.id;
                    return (
                      <button
                        key={col.id}
                        id={`btn-format-${col.id}`}
                        onClick={() => handleSelectFormat(col.id)}
                        className={`px-3.5 py-2.5 text-left border rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {col.name}
                          </span>
                          <span className={`text-[9px] font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {col.label} ({col.fraction})
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {col.width} × {col.length} cm
                          </span>
                          <span className="font-bold whitespace-nowrap text-right">
                            {col.yieldPerSheet} pzas <span className={`font-normal text-[9px] ${isSelected ? 'text-indigo-200' : 'text-slate-450'}`}>/ pliego</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Format trigger */}
                  <button
                    id="btn-format-custom"
                    onClick={() => handleSelectFormat('custom')}
                    className={`px-3.5 py-2.5 text-left border rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                      selectedFormatId === 'custom'
                        ? 'bg-amber-50 text-amber-900 border-2 border-amber-300 font-bold shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50/50 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900">Medida Personalizada</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                      Dimensiones libres
                    </span>
                  </button>
                </div>
              </div>

              {/* CONDITIONAL SUB-FORM: CUSTOM DIMENSIONS */}
              {isCustomMode && (
                <div id="custom-dims-box" className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                    <Crop className="h-4 w-4 text-slate-500" />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Medidas de la Pieza Personalizada</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                        Ancho de la Pieza
                      </label>
                      <div className="relative">
                        <input
                          id="custom-width-input"
                          type="number"
                          step="0.1"
                          min="0.5"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full text-slate-800 bg-white border border-slate-250 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-center font-mono font-bold relative pr-8 transition-all"
                          placeholder="Ancho"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 font-mono pointer-events-none select-none">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                        Largo de la Pieza
                      </label>
                      <div className="relative">
                        <input
                          id="custom-length-input"
                          type="number"
                          step="0.1"
                          min="0.5"
                          value={customLength}
                          onChange={(e) => setCustomLength(e.target.value)}
                          className="w-full text-slate-800 bg-white border border-slate-250 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-center font-mono font-bold relative pr-8 transition-all"
                          placeholder="Largo"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 font-mono pointer-events-none select-none">
                          cm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COLLAPSIBLE ACCORDION FOR ADVANCED CUTTINGS */}
                  <div className="pt-1">
                    <button
                      id="toggle-advanced-btn"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[10px] font-bold text-slate-650 uppercase flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer bg-white border border-slate-200 hover:border-slate-350 px-3 py-2 rounded-xl transition-all"
                    >
                      <Settings className="h-3 w-3" />
                      <span>{showAdvanced ? 'Ocultar Opciones Avanzadas' : 'Ver Opciones Avanzadas'}</span>
                    </button>

                    {showAdvanced && (
                      <div id="advanced-configs" className="p-3.5 bg-white border border-slate-255/80 rounded-xl mt-2 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                              Refile Perímetro (cm)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={sheetMargin}
                              onChange={(e) => setSheetMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-center p-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                              Calle / Gutter (cm)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={pieceGutter}
                              onChange={(e) => setPieceGutter(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-center p-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                            Orientación de la Fibra de Papel
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold">
                            <button
                              onClick={() => setFiberDirection('any')}
                              className={`p-1.5 rounded-lg border cursor-pointer text-center transition-all ${fiberDirection === 'any' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            >
                              Cualquiera
                            </button>
                            <button
                              onClick={() => setFiberDirection('with-width')}
                              className={`p-1.5 rounded-lg border cursor-pointer text-center transition-all ${fiberDirection === 'with-width' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            >
                              Ancho (W)
                            </button>
                            <button
                              onClick={() => setFiberDirection('with-length')}
                              className={`p-1.5 rounded-lg border cursor-pointer text-center transition-all ${fiberDirection === 'with-length' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            >
                              Largo (L)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* INPUTS: TARGET QUANTITY AND WASTE BUFFER */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                
                {/* TARGET VOLANTES */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    CANTIDAD TOTAL DE TRABAJO (OBJETIVO REQUERIDO)
                  </label>
                  <div className="relative">
                    <input
                      id="target-qty-input"
                      type="number"
                      min="1"
                      value={targetQuantity}
                      onChange={(e) => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none rounded-2xl px-4 py-2.5 text-sm text-center font-mono font-bold transition-all"
                      placeholder="Ej: 1000, 2000, 500"
                    />
                    <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-400 font-mono pointer-events-none select-none">
                      uds
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[500, 1000, 2000, 5000, 8000].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setTargetQuantity(qty)}
                        className={`text-[9px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-all ${
                          targetQuantity === qty ? 'bg-indigo-650 text-white border-indigo-650 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {qty.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DEMASÍA / WASTE */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      DEMASÍA DE MERMA DE AJUSTE (%)
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 font-mono">
                      {wastePercentage}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="waste-percent-input"
                      type="number"
                      min="0"
                      max="100"
                      value={wastePercentage}
                      onChange={(e) => setWastePercentage(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none rounded-2xl px-4 py-2.5 text-sm text-center font-mono font-bold transition-all"
                    />
                    <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-400 font-mono pointer-events-none select-none">
                      %
                    </span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[0, 2, 5, 8, 10].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setWastePercentage(pct)}
                        className={`text-[9px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-all ${
                          wastePercentage === pct ? 'bg-indigo-650 text-white border-indigo-650 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* CÓMPUTO DE PLIEGOS REQUERIDOS */}
            {activeLayout && (
              <div id="quick-calc-results" className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-950/20 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-250">
                      CÓMPUTO DE PLIEGOS REQUERIDOS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold border border-indigo-500/30">
                    {activeLayout.piecesPerSheet} × Pliego
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Net Sheets */}
                  <div className="border-l-4 border-slate-800 pl-4 flex flex-col justify-center py-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Pliegos Netos
                    </span>
                    <span className="text-3xl font-bold text-white tracking-tight font-mono mt-1">
                      {activeLayout.totalSheetsNeeded}
                    </span>
                    <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mt-1.5">
                      Sin merma
                    </span>
                  </div>

                  {/* With Waste */}
                  <div className="bg-gradient-to-br from-indigo-650 to-indigo-750 text-white p-4 rounded-2xl flex flex-col justify-center shadow-md shadow-indigo-950/15 border border-indigo-500/25">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide leading-none">
                      <span>CON DEMASÍA</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[9px] font-mono">
                        +{wastePercentage}%
                      </span>
                    </div>
                    <span className="text-3xl font-extrabold tracking-tight font-mono mt-1.5 text-white">
                      {activeLayout.totalSheetsWithWaste}
                    </span>
                    <span className="text-[9px] font-medium uppercase text-indigo-200 tracking-wide mt-1">
                      Pliegos a Pedir
                    </span>
                  </div>
                </div>

                {/* Subtitle with quick info */}
                <div className="text-[10px] text-slate-400 font-medium">
                  Medida: <strong className="text-slate-200 font-semibold">{currentFormatDetails?.dimensions}</strong> • Formato: <strong className="text-slate-200 font-semibold">{isCustomMode ? 'Personalizado' : selectedFormatId.toUpperCase()}</strong>
                </div>
              </div>
            )}

            {/* QUICK FORMULA INSIGHT BANNER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs text-slate-600 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">MÉTODO DE CÁLCULO</div>
              <ul className="space-y-1 list-disc pl-4 font-semibold text-[11px] text-slate-500">
                <li>Pliegos netos = <span className="font-mono text-slate-800 font-black">Math.ceil(Objetivo / Rendimiento)</span></li>
                <li>Con Demasía = <span className="font-mono text-slate-800 font-black">Math.ceil(Neto * 1.{wastePercentage})</span></li>
                <li>Rendimiento estándar basado en la división del pliego sin excedentes.</li>
              </ul>
           </div>

        </div>

      </div>

    </main>

      {/* FOOTER SIGNATURE */}
      <footer className="max-w-xl mx-auto px-4 sm:px-6 mt-12 pb-8 text-center text-[10px] text-slate-400 font-sans print:hidden">
        <div>CALCULADORA DE CORTE Y PLIEGOS DE PAPEL</div>
        <div className="mt-1 font-medium">Inspirado en Google Material Design</div>
      </footer>

      {/* PRINT-ONLY AREA */}
      <div className="hidden print:block font-sans p-8 space-y-6">
        <center className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Ficha Técnica de Corte</h1>
          <p className="text-xs text-slate-500 font-mono">Calculadora de Pliego</p>
        </center>

        <div className="border-t border-b border-slate-300 py-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="font-bold underline text-slate-800">MATERIAL BASE</h3>
            <p className="mt-1"><strong>Formato Seleccionado:</strong> {currentFormatDetails?.name}</p>
            <p><strong>Dimensiones Corte:</strong> {currentFormatDetails?.dimensions}</p>
            {isCustomMode && (
              <>
                <p><strong>Refile Perimetral (Margen):</strong> {sheetMargin} cm</p>
                <p><strong>Calle/Gutter en cortes:</strong> {pieceGutter} cm</p>
              </>
            )}
          </div>
          <div>
            <h3 className="font-bold underline text-slate-800">CÓMPUTO DE PRENSA</h3>
            <p className="mt-1"><strong>Cantidad Solicitada:</strong> {targetQuantity.toLocaleString()} unidades</p>
            <p><strong>Rendimiento por Pliego:</strong> {activeLayout?.piecesPerSheet} piezas/pliego</p>
            <p><strong>Pliegos Netos Necesarios:</strong> {activeLayout?.totalSheetsNeeded} pliegos</p>
            <p><strong>Pliegos con Demasía ({wastePercentage}%):</strong> <span className="font-bold">{activeLayout?.totalSheetsWithWaste} pliegos</span></p>
          </div>
        </div>
      </div>

    </div>
  );
}
