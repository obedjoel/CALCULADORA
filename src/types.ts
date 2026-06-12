export interface PaperCutterInputs {
  sheetWidth: number;
  sheetLength: number;
  pieceWidth: number;
  pieceLength: number;
  sheetMargin: number; // Margins left blank near the edges
  pieceGutter: number; // Space between cut pieces (gutter)
  targetQuantity: number; // Order quantity
  wastePercentage: number; // E.g., 5%
  fiberDirection: 'any' | 'with-width' | 'with-length'; // Enforced direction (sentido de la fibra)
}

export interface CutPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isRotated: boolean; // True if piece was rotated 90 degrees compared to original dimensions
  row: number;
  col: number;
}

export interface CutLayoutResult {
  layoutId: string;
  name: string;
  description: string;
  piecesPerSheet: number;
  pieces: CutPiece[];
  sheetWidth: number;
  sheetLength: number;
  effectiveSheetWidth: number;
  effectiveSheetLength: number;
  usedArea: number;
  totalArea: number;
  efficiency: number; // Percentage
  totalSheetsNeeded: number;
  totalSheetsWithWaste: number;
  wasteAreaPercentage: number;
  orientationUsed: string; // e.g. "Vertical (4x4)", "Rotado (3x5)", "Mixto"
}

export interface SizePreset {
  id: string;
  name: string;
  width: number;
  length: number;
  category: 'sheet' | 'piece';
  description?: string;
}
