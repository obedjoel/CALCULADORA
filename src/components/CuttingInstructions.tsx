import React from 'react';
import { CutLayoutResult } from '../types';
import { Scissors, FileText, Compass, AlertTriangle, ArrowRight, CornerDownRight, Info } from 'lucide-react';

interface CuttingInstructionsProps {
  layout: CutLayoutResult;
  fiberDirection: string;
  targetQuantity: number;
  wastePercentage: number;
}

export default function CuttingInstructions({ 
  layout, 
  fiberDirection, 
  targetQuantity, 
  wastePercentage 
}: CuttingInstructionsProps) {
  const {
    sheetWidth,
    sheetLength,
    pieces,
    effectiveSheetWidth,
    effectiveSheetLength,
    layoutId,
  } = layout;

  if (layoutId === 'empty' || pieces.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-205/60 rounded-2xl p-5 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Sin Plan de Guillotina</h4>
        <p className="text-xs text-amber-700 mt-1.5 max-w-xs mx-auto font-medium leading-relaxed">
          No hay piezas colocadas en el pliego actual. Por favor reduzca el tamaño de las piezas o incremente el pliego para generar instrucciones.
        </p>
      </div>
    );
  }

  // Calculate technical margin
  const marginX = (sheetWidth - effectiveSheetWidth) / 2;
  const marginY = (sheetLength - effectiveSheetLength) / 2;

  // Group pieces to detect the layout structure
  const directPieces = pieces.filter(p => !p.isRotated);
  const rotatedPieces = pieces.filter(p => p.isRotated);

  const totalDirect = directPieces.length;
  const totalRotated = rotatedPieces.length;

  return (
    <div id="instructions-container" className="space-y-5 text-slate-800">
      {/* Intro Info Banner */}
      <div className="flex items-start gap-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest leading-none">Secuencia de Guillotina</h4>
          <p className="text-[11.5px] text-slate-600 leading-relaxed mt-1.5 font-medium">
            Siga este orden para obtener cortes rectos continuos (cortes de guillotina de lado a lado) sin retrocesos innecesarios en la pila de papel, optimizando tiempos de prensa.
          </p>
        </div>
      </div>

      {/* Timeline steps */}
      <div className="relative border-l border-slate-200 pl-6 ml-3.5 space-y-6">
        
        {/* Step 1: Material Verification */}
        <div className="relative">
          <span className="absolute -left-[35px] top-0.5 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm shadow-indigo-100 border border-white">
            1
          </span>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Compass className="h-3.5 w-3.5 text-slate-500" />
              Verificación de Fibra y Alimentación
            </h5>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Coloque la pila de <span className="font-bold text-slate-900 uppercase">{layout.totalSheetsWithWaste} pliegos</span> en la guillotina. 
              {fiberDirection === 'any' && (
                <span> Dirección de fibra seleccionada: <strong className="bg-slate-100 px-1.5 py-0.5 text-slate-600 font-bold font-mono text-[9.5px] rounded-md border border-slate-205">CUALQUIERA / INDIFERENTE</strong>.</span>
              )}
              {fiberDirection === 'with-width' && (
                <span> Asegúrese de colocar los pliegos de modo que la fibra del papel corra paralela al lado ancho de <strong className="font-mono font-bold text-slate-900">{sheetWidth} cm</strong>.</span>
              )}
              {fiberDirection === 'with-length' && (
                <span> Asegúrese de colocar los pliegos de modo que la fibra corra paralela al largo de <strong className="font-mono font-bold text-slate-900">{sheetLength} cm</strong>.</span>
              )}
            </p>
          </div>
        </div>

        {/* Step 2: Technical Margin Trimming */}
        {(marginX > 0 || marginY > 0) && (
          <div className="relative">
            <span className="absolute -left-[35px] top-0.5 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm shadow-indigo-100 border border-white">
              2
            </span>
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Scissors className="h-3.5 w-3.5 text-slate-500" />
                Refile Perimetral (Pinzas)
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Realice un corte perimetral de limpieza para retirar los bordes técnicos inutilizables de las hojas:
              </p>
              <ul className="text-xs text-slate-705 space-y-1 pl-4 list-disc mt-1.5 font-mono font-semibold">
                {marginX > 0 && (
                  <li>Recortar <strong className="bg-rose-50 text-rose-700 border border-rose-100 px-1 py-0.5 rounded">{marginX} cm</strong> en los laterales izquierdo y derecho.</li>
                )}
                {marginY > 0 && (
                  <li>Recortar <strong className="bg-rose-50 text-rose-700 border border-rose-100 px-1 py-0.5 rounded">{marginY} cm</strong> en los cabezales superior e inferior.</li>
                )}
                <li className="text-slate-450 italic font-sans font-medium text-[11px] mt-1">Superficie útil disponible: {effectiveSheetWidth} × {effectiveSheetLength} cm.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Guillotine Slices */}
        <div className="relative">
          <span className="absolute -left-[35px] top-0.5 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm shadow-indigo-100 border border-white">
            {marginX > 0 || marginY > 0 ? 3 : 2}
          </span>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Cortes de Tiras Primarias
            </h5>
            
            {/* If direct alignment only */}
            {totalDirect > 0 && totalRotated === 0 && (
              <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                <p className="font-semibold">
                  El pliego se divide uniformemente en cortes directos sistemáticos:
                </p>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-2 mt-2">
                  <div className="flex items-start gap-2 text-slate-800">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600 shrink-0" />
                    <div className="font-semibold">
                      <strong>Corte Horizontal:</strong> Divida el pliego en tiras horizontales de{' '}
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-bold px-1.5 py-0.5 rounded">
                        {directPieces[0].height} cm
                      </span>{' '}
                      de alto.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-slate-800 pt-2 border-t border-dashed border-slate-200">
                    <CornerDownRight className="h-4 w-4 mt-0.5 text-indigo-650 shrink-0 ml-3" />
                    <div className="font-semibold">
                      <strong>Corte Secundario:</strong> Tome la pila de tiras y fracciónelas transversalmente cada{' '}
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-bold px-1.5 py-0.5 rounded">
                        {directPieces[0].width} cm
                      </span>.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If fully rotated only */}
            {totalRotated > 0 && totalDirect === 0 && (
              <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                <p className="font-semibold">
                  El pliego se divide óptimamente con todas las piezas giradas 90°:
                </p>
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-2 mt-2">
                  <div className="flex items-start gap-2 text-slate-800">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-indigo-600 shrink-0" />
                    <div className="font-semibold">
                      <strong>Corte de Tiras:</strong> Divida el pliego en tiras horizontales de{' '}
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-bold px-1.5 py-0.5 rounded">
                        {rotatedPieces[0].height} cm
                      </span>{' '}
                      de alto.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-slate-800 pt-2 border-t border-dashed border-slate-200">
                    <CornerDownRight className="h-4 w-4 mt-0.5 text-indigo-650 shrink-0 ml-3" />
                    <div className="font-semibold">
                      <strong>Cortes de Piezas:</strong> Slice transversalmente las tiras apiladas cada{' '}
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-bold px-1.5 py-0.5 rounded">
                        {rotatedPieces[0].width} cm
                      </span>.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mixed Cuts layout guides */}
            {totalDirect > 0 && totalRotated > 0 && (
              <div className="text-xs text-slate-650 space-y-1 leading-relaxed">
                <p className="font-semibold text-slate-605">
                  Dado que está utilizando un <strong className="font-bold text-slate-800">Corte Mixto Avanzado</strong> para aprovechar el excedente de mermas, divida el pliego en dos bloques de guillotina principales:
                </p>
                
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 mt-2">
                  <div>
                    <h6 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      Bloque A (Corte Directo: {totalDirect} unidades)
                    </h6>
                    <ul className="list-disc pl-5 mt-1.5 text-[11px] text-slate-500 space-y-0.5 font-medium">
                      <li>Fraccione la cuadrícula principal en tiras de <strong>{directPieces[0].height} cm</strong>.</li>
                      <li>Divida cada tira transversalmente en piezas de <strong>{directPieces[0].width} cm</strong>.</li>
                    </ul>
                  </div>

                  <div className="border-t border-slate-200 pt-2.5">
                    <h6 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Bloque B (Excedente Girado: {totalRotated} unidades)
                    </h6>
                    <ul className="list-disc pl-5 mt-1.5 text-[11px] text-slate-500 space-y-0.5 font-medium">
                      <li>Tome el sobrante de papel restante y divídalo en tiras de <strong>{rotatedPieces[0].height} cm</strong>.</li>
                      <li>Divida estas tiras transversalmente en piezas de <strong>{rotatedPieces[0].width} cm</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Quality & Delivery */}
        <div className="relative font-sans">
          <span className="absolute -left-[35px] top-0.5 flex items-center justify-center h-6 w-6 rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm shadow-teal-100 border border-white">
            ★
          </span>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              Control de Calidad e Inventario
            </h5>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Cada pliego rinde exactamente <span className="font-bold text-slate-800">{layout.piecesPerSheet} piezas</span> terminadas.
              Al procesar los <span className="font-bold text-slate-800">{layout.totalSheetsWithWaste} pliegos</span> cargados en la orden obtendrá un estimado final de <span className="font-bold text-slate-900">{layout.piecesPerSheet * layout.totalSheetsWithWaste} volantes/piezas</span> (cubriendo el objetivo de {targetQuantity} unidades con {wastePercentage}% de demasía técnica por mermas o montaje).
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
