import React from 'react';

/**
 * Módulo Futuro: Checklist de Calidad para Director de Obra
 * 
 * Estructura sugerida para los datos:
 * interface ChecklistItem {
 *   id: string;
 *   description: string; // ej. "Se verificó la plomada y escuadra"
 *   isMandatory: boolean;
 *   status: 'pending' | 'approved' | 'rejected';
 *   images?: string[]; // URLs de fotos de evidencia
 *   comments?: string;
 * }
 * 
 * Este componente será invocado desde la vista de Tarea Ejecutada,
 * permitiendo al Director de Obra firmar la calidad de la misma.
 */

export const QualityChecklist: React.FC = () => {
  return (
    <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl opacity-50">
      <p className="text-center text-sm font-medium text-slate-500">
        [Módulo Futuro] Checklist de Calidad para el Director de Obra
      </p>
    </div>
  );
};
