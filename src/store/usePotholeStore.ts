import { create } from 'zustand';
import { PotholeState, PotholeActions } from '../types/pothole';

const usePotholeStore = create<PotholeState & PotholeActions>((set) => ({
  isTracking: false,
  currentLocation: { lat: 35.1595, lng: 126.8526 }, // 광주 기본 좌표

  setIsTracking: (val) => set({ isTracking: val }),
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
}));

export default usePotholeStore;
