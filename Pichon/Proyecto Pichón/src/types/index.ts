export type UnitType = 'm2' | 'm3' | 'ml' | 'gl' | 'un';

export interface Material {
  id: string;
  name: string; // e.g. "Cemento Portland"
  unit: string; // e.g. "kg"
  yield: number; // e.g. 8.5 (kg per task unit)
  cost: number; // ARS
  volumePerUnit?: number; // m3 per material unit (for logistics)
  weightPerUnit?: number; // kg per material unit (for logistics)
  areaPerUnit?: number; // m2 per material unit (for logistics)
  sensitiveToMoisture?: boolean; // alerts for moisture
  commercialUnit: string; // e.g. "bolsa de 50kg"
  commercialPackagingQuantity: number; // e.g. 50
  wasteFactor: number; // e.g. 1.05 for 5% waste
}

export interface Labor {
  role: 'Oficial' | 'Ayudante' | 'Medio Oficial';
  hoursPerUnit: number; // hours per task unit
  hourlyRate: number; // ARS
}

export interface APU {
  materials: Material[];
  labor: Labor[];
}

export interface WasteEstimator {
  factor: number;
  description: string;
}

export interface Task {
  id: string;
  name: string; // e.g. "1.1.1 Cubiertas"
  unit: UnitType;
  apu: APU;
  wasteEstimator?: WasteEstimator;
  suggestion?: string; // For reuse of surplus
}

export interface SubCategory {
  id: string;
  name: string; // e.g. "1.1 Demoliciones"
  tasks: Task[];
}

export interface Category {
  id: string;
  name: string; // e.g. "1 TAREAS PRELIMINARES"
  subcategories: SubCategory[];
  phase?: Phase;
  predecessors?: string[];
}

export type Phase = 'A' | 'B' | 'C';

// Store types
export interface CartItem {
  id: string; // unique id for cart entry
  task: Task;
  quantity: number;
  dimensions?: {
    length?: number;
    width?: number;
    depth?: number;
  };
  appliedLeftovers?: Record<string, number>; // materialId -> amount
  generatedLeftovers?: Record<string, number>; // materialId -> amount
  consumedFromVault?: Record<string, Record<string, number>>; // phase -> materialId -> amount
  categoryId?: string; // To track where it came from
  phase?: Phase;
}
