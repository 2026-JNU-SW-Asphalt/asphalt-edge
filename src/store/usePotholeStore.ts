import { create } from 'zustand';
import { PotholeState, PotholeActions, LocationData } from '../types/pothole';

const usePotholeStore = create<PotholeState & PotholeActions>((set) => ({
  isTracking: false,
  currentLocation: { lat: 35.1595, lng: 126.8526 }, // 광주 기본 좌표

  isConnected: false,
  sessionId: null,
  sequence: 0,

  setIsTracking: (val: boolean) =>
    set((state) => ({
      isTracking: val,
      sessionId: val ? Date.now().toString() : null,
      sequence: 0,
    })),

  setCurrentLocation: (loc: LocationData) => set({ currentLocation: loc }),

  setIsConnected: (val: boolean) => set({ isConnected: val }),

  incrementSequence: () => set((state) => ({ sequence: state.sequence + 1 })),
}));

export default usePotholeStore;
