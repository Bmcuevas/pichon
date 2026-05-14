import { Task, Material, Labor } from '../types';

export interface CalculatedMaterial extends Material {
  totalPureQuantity: number;
  totalWithWaste: number;
  commercialQuantityToBuy: number;
  surplusQuantity: number;
  surplusPercentage: number;
  totalCostARS: number;
  totalLogisticsVolume: number; // m3
  totalLogisticsWeight: number; // kg
  totalLogisticsArea: number; // m2
}

export interface CalculatedLabor extends Labor {
  totalHours: number;
  totalCostARS: number;
}

export interface TaskResults {
  materials: CalculatedMaterial[];
  labor: CalculatedLabor[];
  totalMaterialsCost: number;
  totalLaborCost: number;
  grandTotal: number;
  totalLogisticsVolume: number;
  totalLogisticsWeight: number;
  totalLogisticsArea: number;
  wasteVolume: number;
}

export const calculateTaskResults = (
  task: Task, 
  quantity: number, 
  appliedLeftovers?: Record<string, number>,
  getHourlyRate?: (role: string) => number
): TaskResults => {
  const materials: CalculatedMaterial[] = task.apu.materials.map(mat => {
    const totalPureQuantity = mat.yield * quantity;
    const totalWithWaste = totalPureQuantity * mat.wasteFactor;
    
    // Descontar sobrantes aplicados (en la unidad del material, ej. kg)
    const applied = appliedLeftovers?.[mat.id] || 0;
    const effectiveRequirement = Math.max(0, totalWithWaste - applied);
    
    // Calculate how many commercial units to buy
    const commercialQuantityToBuy = Math.ceil(effectiveRequirement / mat.commercialPackagingQuantity);
    const totalCommercialAmount = commercialQuantityToBuy * mat.commercialPackagingQuantity;
    
    const surplusQuantity = totalCommercialAmount - effectiveRequirement;
    const surplusPercentage = totalCommercialAmount > 0 ? (surplusQuantity / mat.commercialPackagingQuantity) * 100 : 0;
    
    const totalCostARS = effectiveRequirement * mat.cost;
    const totalLogisticsVolume = (mat.volumePerUnit || 0) * effectiveRequirement;
    
    // Calculate weight. If unit is kg, it's just effectiveRequirement. Otherwise, use weightPerUnit if available.
    const totalLogisticsWeight = mat.unit === 'kg' ? effectiveRequirement : (mat.weightPerUnit || 0) * effectiveRequirement;
    
    let footprintPerCommercialUnit = 0;
    if (mat.commercialUnit.toLowerCase().includes('pallet')) footprintPerCommercialUnit = 1.20;
    else if (mat.commercialUnit.toLowerCase().includes('bolsón')) footprintPerCommercialUnit = 1.00;

    const totalLogisticsArea = footprintPerCommercialUnit * commercialQuantityToBuy;

    return {
      ...mat,
      totalPureQuantity,
      totalWithWaste: effectiveRequirement, // Replace original with effective for downstream logic if needed
      commercialQuantityToBuy,
      surplusQuantity,
      surplusPercentage,
      totalCostARS,
      totalLogisticsVolume,
      totalLogisticsWeight,
      totalLogisticsArea
    };
  });

  const labor: CalculatedLabor[] = task.apu.labor.map(lab => {
    const totalHours = lab.hoursPerUnit * quantity;
    const rateToUse = getHourlyRate ? getHourlyRate(lab.role) : lab.hourlyRate;
    const totalCostARS = totalHours * rateToUse;
    return { ...lab, hourlyRate: rateToUse, totalHours, totalCostARS };
  });

  const totalMaterialsCost = materials.reduce((acc, m) => acc + m.totalCostARS, 0);
  const totalLaborCost = labor.reduce((acc, l) => acc + l.totalCostARS, 0);
  const totalLogisticsVolume = materials.reduce((acc, m) => acc + m.totalLogisticsVolume, 0);
  const totalLogisticsWeight = materials.reduce((acc, m) => acc + m.totalLogisticsWeight, 0);
  const totalLogisticsArea = materials.reduce((acc, m) => acc + m.totalLogisticsArea, 0);

  // Simple waste estimator: either provided by the task or derived
  const wasteVolume = task.wasteEstimator ? task.wasteEstimator.factor * quantity * 0.1 : 0; // heuristic

  return {
    materials,
    labor,
    totalMaterialsCost,
    totalLaborCost,
    grandTotal: totalMaterialsCost + totalLaborCost,
    totalLogisticsVolume,
    totalLogisticsWeight,
    totalLogisticsArea,
    wasteVolume
  };
};
