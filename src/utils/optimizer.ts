import { PaperCutterInputs, CutPiece, CutLayoutResult, SizePreset } from '../types';

/**
 * Calculates a layout result based on inputs and a strategy
 */
export function calculateLayouts(inputs: PaperCutterInputs): CutLayoutResult[] {
  const {
    sheetWidth,
    sheetLength,
    pieceWidth,
    pieceLength,
    sheetMargin,
    pieceGutter,
    targetQuantity,
    wastePercentage,
    fiberDirection
  } = inputs;

  // Guard against invalid inputs
  if (
    sheetWidth <= 0 ||
    sheetLength <= 0 ||
    pieceWidth <= 0 ||
    pieceLength <= 0 ||
    sheetMargin < 0
  ) {
    return [];
  }

  const activeW = Math.max(0, sheetWidth - 2 * sheetMargin);
  const activeL = Math.max(0, sheetLength - 2 * sheetMargin);
  const totalArea = sheetWidth * sheetLength;
  const singlePieceArea = pieceWidth * pieceLength;

  const results: CutLayoutResult[] = [];

  // Helper to generate a unique ID
  const uuid = () => Math.random().toString(36).substring(2, 9);

  // Helper to construct a standard layout result
  const buildResult = (
    layoutId: string,
    name: string,
    description: string,
    pieces: CutPiece[],
    orientationUsed: string
  ): CutLayoutResult => {
    const piecesPerSheet = pieces.length;
    const usedArea = piecesPerSheet * singlePieceArea;
    const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
    const wasteAreaPercentage = 100 - efficiency;

    // Math.ceil for sheets required as per logic_notes: "Math.ceil for sheets"
    const totalSheetsNeeded = piecesPerSheet > 0 ? Math.ceil(targetQuantity / piecesPerSheet) : 0;
    const extraSheets = Math.ceil(totalSheetsNeeded * (wastePercentage / 100));
    const totalSheetsWithWaste = totalSheetsNeeded + extraSheets;

    return {
      layoutId,
      name,
      description,
      piecesPerSheet,
      pieces,
      sheetWidth,
      sheetLength,
      effectiveSheetWidth: activeW,
      effectiveSheetLength: activeL,
      usedArea,
      totalArea,
      efficiency,
      totalSheetsNeeded,
      totalSheetsWithWaste,
      wasteAreaPercentage,
      orientationUsed
    };
  };

  // --- LAYOUT 1: Normal Uniform (Horizontal / Vertical basándose en entrada) ---
  // Pieza normal: pieceWidth de ancho, pieceLength de alto
  if (fiberDirection === 'any' || fiberDirection === 'with-width') {
    const pieces: CutPiece[] = [];
    const nx = Math.floor((activeW + pieceGutter) / (pieceWidth + pieceGutter));
    const ny = Math.floor((activeL + pieceGutter) / (pieceLength + pieceGutter));

    if (nx > 0 && ny > 0) {
      for (let r = 0; r < ny; r++) {
        for (let c = 0; c < nx; c++) {
          pieces.push({
            id: `norm-${r}-${c}-${uuid()}`,
            x: sheetMargin + c * (pieceWidth + pieceGutter),
            y: sheetMargin + r * (pieceLength + pieceGutter),
            width: pieceWidth,
            height: pieceLength,
            isRotated: false,
            row: r,
            col: c
          });
        }
      }
      results.push(
        buildResult(
          'standard-direct',
          'Alineación Directa',
          `Piezas orientadas normalmente (${nx} horizontal x ${ny} vertical)`,
          pieces,
          `Directo (${nx}x${ny})`
        )
      );
    }
  }

  // --- LAYOUT 2: Rotado Uniforme ---
  // Pieza rotada 90º: pieceLength de ancho, pieceWidth de alto
  if (fiberDirection === 'any' || fiberDirection === 'with-length') {
    const pieces: CutPiece[] = [];
    const nx = Math.floor((activeW + pieceGutter) / (pieceLength + pieceGutter));
    const ny = Math.floor((activeL + pieceGutter) / (pieceWidth + pieceGutter));

    if (nx > 0 && ny > 0) {
      for (let r = 0; r < ny; r++) {
        for (let c = 0; c < nx; c++) {
          pieces.push({
            id: `rot-${r}-${c}-${uuid()}`,
            x: sheetMargin + c * (pieceLength + pieceGutter),
            y: sheetMargin + r * (pieceWidth + pieceGutter),
            width: pieceLength,
            height: pieceWidth,
            isRotated: true,
            row: r,
            col: c
          });
        }
      }
      results.push(
        buildResult(
          'standard-rotated',
          'Alineación Rotada',
          `Todas las piezas rotadas 90° (${nx} horizontal x ${ny} vertical)`,
          pieces,
          `Rotado (${nx}x${ny})`
        )
      );
    }
  }

  // --- LAYOUT 3: Mixto (Directo Principal + Tira de Sobrante Derecha Rotada) ---
  if (fiberDirection === 'any') {
    const nx = Math.floor((activeW + pieceGutter) / (pieceWidth + pieceGutter));
    const ny = Math.floor((activeL + pieceGutter) / (pieceLength + pieceGutter));

    if (nx > 0 && ny > 0) {
      const pieces: CutPiece[] = [];
      // Agregar piezas normales
      for (let r = 0; r < ny; r++) {
        for (let c = 0; c < nx; c++) {
          pieces.push({
            id: `mix-d-p-${r}-${c}-${uuid()}`,
            x: sheetMargin + c * (pieceWidth + pieceGutter),
            y: sheetMargin + r * (pieceLength + pieceGutter),
            width: pieceWidth,
            height: pieceLength,
            isRotated: false,
            row: r,
            col: c
          });
        }
      }

      // Calcular sobrante a la derecha de la cuadrícula principal
      const usedW = nx * pieceWidth + (nx - 1) * pieceGutter;
      const remainingW = activeW - usedW - pieceGutter;

      // Medidas de la pieza rotada: ancho = pieceLength, alto = pieceWidth
      const sideNx = Math.floor((remainingW + pieceGutter) / (pieceLength + pieceGutter));
      const sideNy = Math.floor((activeL + pieceGutter) / (pieceWidth + pieceGutter));

      if (sideNx > 0 && sideNy > 0) {
        for (let r = 0; r < sideNy; r++) {
          for (let c = 0; c < sideNx; c++) {
            pieces.push({
              id: `mix-d-s-${r}-${c}-${uuid()}`,
              x: sheetMargin + usedW + pieceGutter + c * (pieceLength + pieceGutter),
              y: sheetMargin + r * (pieceWidth + pieceGutter),
              width: pieceLength,
              height: pieceWidth,
              isRotated: true,
              row: r,
              col: nx + c
            });
          }
        }
        results.push(
          buildResult(
            'mixed-right-rotated',
            'Mixto (Base Directa + Lateral Rotado)',
            `Optimiza el remanente derecho con piezas giradas 90°`,
            pieces,
            `Mixto Directo + Lat (${pieces.length} piezas)`
          )
        );
      }
    }
  }

  // --- LAYOUT 4: Mixto (Directo Principal + Tira de Sobrante Inferior Rotada) ---
  if (fiberDirection === 'any') {
    const nx = Math.floor((activeW + pieceGutter) / (pieceWidth + pieceGutter));
    const ny = Math.floor((activeL + pieceGutter) / (pieceLength + pieceGutter));

    if (nx > 0 && ny > 0) {
      const pieces: CutPiece[] = [];
      // Agregar piezas normales
      for (let r = 0; r < ny; r++) {
        for (let c = 0; c < nx; c++) {
          pieces.push({
            id: `mix-b-p-${r}-${c}-${uuid()}`,
            x: sheetMargin + c * (pieceWidth + pieceGutter),
            y: sheetMargin + r * (pieceLength + pieceGutter),
            width: pieceWidth,
            height: pieceLength,
            isRotated: false,
            row: r,
            col: c
          });
        }
      }

      // Calcular sobrante inferior
      const usedL = ny * pieceLength + (ny - 1) * pieceGutter;
      const remainingL = activeL - usedL - pieceGutter;

      // Pieza rotada en sobrante inferior: ancho = pieceLength, alto = pieceWidth
      const bNx = Math.floor((activeW + pieceGutter) / (pieceLength + pieceGutter));
      const bNy = Math.floor((remainingL + pieceGutter) / (pieceWidth + pieceGutter));

      if (bNx > 0 && bNy > 0) {
        for (let r = 0; r < bNy; r++) {
          for (let c = 0; c < bNx; c++) {
            pieces.push({
              id: `mix-b-s-${r}-${c}-${uuid()}`,
              x: sheetMargin + c * (pieceLength + pieceGutter),
              y: sheetMargin + usedL + pieceGutter + r * (pieceWidth + pieceGutter),
              width: pieceLength,
              height: pieceWidth,
              isRotated: true,
              row: ny + r,
              col: c
            });
          }
        }
        results.push(
          buildResult(
            'mixed-bottom-rotated',
            'Mixto (Base Directa + Base Rotada)',
            `Optimiza el remanente inferior con piezas giradas 90°`,
            pieces,
            `Mixto Directo + Inf (${pieces.length} piezas)`
          )
        );
      }
    }
  }

  // --- LAYOUT 5: Mixto (Rotado Principal + Tira de Sobrante Derecha Normal) ---
  if (fiberDirection === 'any') {
    const nx = Math.floor((activeW + pieceGutter) / (pieceLength + pieceGutter));
    const ny = Math.floor((activeL + pieceGutter) / (pieceWidth + pieceGutter));

    if (nx > 0 && ny > 0) {
      const pieces: CutPiece[] = [];
      // Agregar piezas rotadas principales
      for (let r = 0; r < ny; r++) {
        for (let c = 0; c < nx; c++) {
          pieces.push({
            id: `mix-mr-p-${r}-${c}-${uuid()}`,
            x: sheetMargin + c * (pieceLength + pieceGutter),
            y: sheetMargin + r * (pieceWidth + pieceGutter),
            width: pieceLength,
            height: pieceWidth,
            isRotated: true,
            row: r,
            col: c
          });
        }
      }

      // Calcular sobrante lateral derecho
      const usedW = nx * pieceLength + (nx - 1) * pieceGutter;
      const remainingW = activeW - usedW - pieceGutter;

      // Pieza normal en remanente derecho: ancho = pieceWidth, alto = pieceLength
      const sideNx = Math.floor((remainingW + pieceGutter) / (pieceWidth + pieceGutter));
      const sideNy = Math.floor((activeL + pieceGutter) / (pieceLength + pieceGutter));

      if (sideNx > 0 && sideNy > 0) {
        for (let r = 0; r < sideNy; r++) {
          for (let c = 0; c < sideNx; c++) {
            pieces.push({
              id: `mix-mr-s-${r}-${c}-${uuid()}`,
              x: sheetMargin + usedW + pieceGutter + c * (pieceWidth + pieceGutter),
              y: sheetMargin + r * (pieceLength + pieceGutter),
              width: pieceWidth,
              height: pieceLength,
              isRotated: false,
              row: r,
              col: nx + c
            });
          }
        }
        results.push(
          buildResult(
            'mixed-right-normal',
            'Mixto (Base Rotada + Lateral Directo)',
            `Optimiza el remanente derecho de una base rotada con piezas normales`,
            pieces,
            `Mixto Rotado + Lat (${pieces.length} piezas)`
          )
        );
      }
    }
  }

  // --- LAYOUT 6: Mixto (Rotado Principal + Tira de Sobrante Inferior Normal) ---
  if (fiberDirection === 'any') {
    const nx = Math.floor((activeW + pieceGutter) / (pieceLength + pieceGutter));
    const ny = Math.floor((activeL + pieceGutter) / (pieceWidth + pieceGutter));

    if (nx > 0 && ny > 0) {
      const pieces: CutPiece[] = [];
      // Agregar piezas rotadas principales
      for (let r = 0; r < ny; r++) {
        for (let c = 0; c < nx; c++) {
          pieces.push({
            id: `mix-mb-p-${r}-${c}-${uuid()}`,
            x: sheetMargin + c * (pieceLength + pieceGutter),
            y: sheetMargin + r * (pieceWidth + pieceGutter),
            width: pieceLength,
            height: pieceWidth,
            isRotated: true,
            row: r,
            col: c
          });
        }
      }

      // Calcular sobrante inferior
      const usedL = ny * pieceWidth + (ny - 1) * pieceGutter;
      const remainingL = activeL - usedL - pieceGutter;

      // Pieza normal en remanente inferior: ancho = pieceWidth, alto = pieceLength
      const bNx = Math.floor((activeW + pieceGutter) / (pieceWidth + pieceGutter));
      const bNy = Math.floor((remainingL + pieceGutter) / (pieceLength + pieceGutter));

      if (bNx > 0 && bNy > 0) {
        for (let r = 0; r < bNy; r++) {
          for (let c = 0; c < bNx; c++) {
            pieces.push({
              id: `mix-mb-s-${r}-${c}-${uuid()}`,
              x: sheetMargin + c * (pieceWidth + pieceGutter),
              y: sheetMargin + usedL + pieceGutter + r * (pieceLength + pieceGutter),
              width: pieceWidth,
              height: pieceLength,
              isRotated: false,
              row: ny + r,
              col: c
            });
          }
        }
        results.push(
          buildResult(
            'mixed-bottom-normal',
            'Mixto (Base Rotada + Base Directa)',
            `Optimiza el remanente inferior de una base rotada con piezas normales`,
            pieces,
            `Mixto Rotado + Inf (${pieces.length} piezas)`
          )
        );
      }
    }
  }

  // If no layouts were found (pieces are larger than the printable sheet area), create a blank layout
  if (results.length === 0) {
    results.push({
      layoutId: 'empty',
      name: 'Sin Ajuste possible',
      description: 'Las medidas de la pieza exceden el área útil del pliego.',
      piecesPerSheet: 0,
      pieces: [],
      sheetWidth,
      sheetLength,
      effectiveSheetWidth: activeW,
      effectiveSheetLength: activeL,
      usedArea: 0,
      totalArea,
      efficiency: 0,
      totalSheetsNeeded: 0,
      totalSheetsWithWaste: 0,
      wasteAreaPercentage: 100,
      orientationUsed: 'Ninguna'
    });
  }

  // Sort layouts by yield (highest piecesPerSheet, then highest efficiency)
  return results.sort((a, b) => {
    if (b.piecesPerSheet !== a.piecesPerSheet) {
      return b.piecesPerSheet - a.piecesPerSheet;
    }
    return b.efficiency - a.efficiency;
  });
}

/**
 * Standard sizes preset dictionary
 */
export const PRESETS_PLIEGOS: SizePreset[] = [
  { id: 'p-61-86', name: 'Pliego Estándar Imprenta', width: 61, length: 86, category: 'sheet', description: '61 x 86 cm (Tamaño común de offset)' },
  { id: 'p-70-100', name: 'Pliego Grande (70x100)', width: 70, length: 100, category: 'sheet', description: '70 x 100 cm (Afiches / Planchas grandes)' },
  { id: 'p-50-70', name: 'Medio Pliego (50x70)', width: 50, length: 70, category: 'sheet', description: '50 x 70 cm' },
  { id: 'p-carton-65-95', name: 'Pliego Cartón Gris / Cartulina', width: 65, length: 95, category: 'sheet', description: '65 x 95 cm' },
  { id: 'p-oficio-34', name: 'Oficio / Legal Doble', width: 22, length: 34, category: 'sheet', description: '22 x 34 cm' },
  { id: 'p-carta-tabloide', name: 'Tabloide / Doble Carta', width: 27.9, length: 43.2, category: 'sheet', description: '11 x 17 in (Súper A3)' },
  { id: 'p-sra3', name: 'SRA3 (Digital)', width: 32, length: 45, category: 'sheet', description: '32 x 45 cm (Común en imprenta digital láser)' }
];

export const PRESETS_PIEZAS: SizePreset[] = [
  { id: 'z-a4', name: 'Carta / A4 Estándar', width: 21, length: 29.7, category: 'piece', description: 'A4 estándar (21 x 29.7 cm)' },
  { id: 'z-a5', name: 'Volante Medio Oficio / A5', width: 14.8, length: 21, category: 'piece', description: 'Volante A5 (14.8 x 21 cm)' },
  { id: 'z-a6', name: 'Folleto Pequeño / A6', width: 10.5, length: 14.8, category: 'piece', description: 'A6 (10.5 x 14.8 cm)' },
  { id: 'z-tarjeta', name: 'Tarjeta de Visita Estándar', width: 5, length: 9, category: 'piece', description: '5 x 9 cm (u 8.5 x 5.5 cm)' },
  { id: 'z-a7', name: 'Micro folleto / A7', width: 7.4, length: 10.5, category: 'piece', description: 'A7 (7.4 x 10.5 cm)' },
  { id: 'z-cuadrado', name: 'Separador / Cuadrado', width: 15, length: 15, category: 'piece', description: '15 x 15 cm' },
  { id: 'z-post', name: 'Postal', width: 10, length: 15, category: 'piece', description: '10 x 15 cm' },
  { id: 'z-oficio', name: 'Oficio Latino', width: 21.6, length: 33, category: 'piece', description: 'Oficio (21.6 x 33 cm)' }
];
