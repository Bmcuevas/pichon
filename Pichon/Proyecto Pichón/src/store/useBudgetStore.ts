import { create } from 'zustand';
import { CartItem } from '../types';
import { calculateTaskResults } from '../utils/calculations';

interface BudgetState {
  cart: CartItem[];
  leftoverVault: Record<'A' | 'B' | 'C', Record<string, number>>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalCost: () => number;
  getTotalWasteVolume: () => number;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  cart: [],
  leftoverVault: { A: {}, B: {}, C: {} },
  addToCart: (item) => set((state) => {
    const results = calculateTaskResults(item.task, item.quantity, item.appliedLeftovers);
    const newVault = { ...state.leftoverVault };

    const consumedFromVault: Record<string, Record<string, number>> = {};

    if (item.appliedLeftovers) {
      Object.entries(item.appliedLeftovers).forEach(([matId, amount]) => {
        let remainingToDeduct = amount;
        
        // Fases compatibles en orden de preferencia (misma fase, luego fase anterior)
        const compatiblePhases = item.phase === 'C' ? ['C', 'B'] : item.phase === 'B' ? ['B', 'A'] : ['A'];
        
        for (const p of compatiblePhases) {
          const vaultPhase = p as 'A' | 'B' | 'C';
          if (newVault[vaultPhase][matId] && remainingToDeduct > 0) {
            const deduct = Math.min(newVault[vaultPhase][matId], remainingToDeduct);
            newVault[vaultPhase] = { ...newVault[vaultPhase], [matId]: newVault[vaultPhase][matId] - deduct };
            
            if (!consumedFromVault[vaultPhase]) consumedFromVault[vaultPhase] = {};
            consumedFromVault[vaultPhase][matId] = (consumedFromVault[vaultPhase][matId] || 0) + deduct;

            remainingToDeduct -= deduct;
          }
        }
      });
    }

    // Add generated surplus
    const generatedLeftovers: Record<string, number> = {};
    if (item.phase) {
      results.materials.forEach(mat => {
        if (mat.surplusQuantity > 0) {
          const currentAmount = newVault[item.phase!][mat.id] || 0;
          newVault[item.phase!] = {
            ...newVault[item.phase!],
            [mat.id]: currentAmount + mat.surplusQuantity
          };
          generatedLeftovers[mat.id] = mat.surplusQuantity;
        }
      });
    }

    const newItem = { 
      ...item, 
      generatedLeftovers: Object.keys(generatedLeftovers).length > 0 ? generatedLeftovers : undefined,
      consumedFromVault: Object.keys(consumedFromVault).length > 0 ? consumedFromVault : undefined
    };

    return { 
      cart: [...state.cart, newItem],
      leftoverVault: newVault
    };
  }),
  removeFromCart: (id) => set((state) => {
    const item = state.cart.find(i => i.id === id);
    if (!item) return state;

    const newVault = { ...state.leftoverVault };
    
    // Remove generated surplus
    if (item.phase && item.generatedLeftovers) {
      Object.entries(item.generatedLeftovers).forEach(([matId, amount]) => {
         const current = newVault[item.phase!][matId] || 0;
         newVault[item.phase!] = { ...newVault[item.phase!], [matId]: Math.max(0, current - amount) };
      });
    }

    // Restore consumed leftovers based on exact origin
    if (item.consumedFromVault) {
      Object.entries(item.consumedFromVault).forEach(([phaseKey, materials]) => {
        const pVault = phaseKey as 'A' | 'B' | 'C';
        Object.entries(materials).forEach(([matId, amount]) => {
          const current = newVault[pVault][matId] || 0;
          newVault[pVault] = { ...newVault[pVault], [matId]: current + amount };
        });
      });
    } else if (item.phase && item.appliedLeftovers) {
      // Fallback for old items that didn't track origin
      Object.entries(item.appliedLeftovers).forEach(([matId, amount]) => {
         const current = newVault[item.phase!][matId] || 0;
         newVault[item.phase!] = { ...newVault[item.phase!], [matId]: current + amount };
      });
    }

    return {
      cart: state.cart.filter((item) => item.id !== id),
      leftoverVault: newVault
    };
  }),
  clearCart: () => set({ cart: [], leftoverVault: { A: {}, B: {}, C: {} } }),
  getTotalCost: () => {
    // Will be calculated in the UI or here by importing calculations
    return 0; // simplified for now
  },
  getTotalWasteVolume: () => {
    const { cart } = get();
    return cart.reduce((total, item) => {
      const results = calculateTaskResults(item.task, item.quantity);
      return total + results.wasteVolume;
    }, 0);
  }
}));
