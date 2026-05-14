import { create } from 'zustand';

interface SettingsState {
  workdayHours: number;
  dailyRates: {
    oficial: number;
    medioOficial: number;
    ayudante: number;
  };
  setWorkdayHours: (hours: number) => void;
  setDailyRates: (rates: Partial<SettingsState['dailyRates']>) => void;
  getHourlyRate: (role: string) => number;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  workdayHours: 8,
  dailyRates: {
    oficial: 120000,
    medioOficial: 110000,
    ayudante: 100000,
  },
  setWorkdayHours: (hours) => set({ workdayHours: hours }),
  setDailyRates: (rates) => set(state => ({
    dailyRates: { ...state.dailyRates, ...rates }
  })),
  getHourlyRate: (role) => {
    const { dailyRates, workdayHours } = get();
    const r = role.toLowerCase();
    if (r.includes('oficial') && r.includes('medio')) return dailyRates.medioOficial / workdayHours;
    if (r.includes('oficial'))  return dailyRates.oficial / workdayHours;
    if (r.includes('ayudante')) return dailyRates.ayudante / workdayHours;
    return dailyRates.ayudante / workdayHours;
  },
}));
