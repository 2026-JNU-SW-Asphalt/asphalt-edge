import { create } from 'zustand';
import { PotholeState, PotholeActions } from '../types/pothole';

/**
 * @function usePotholeStore
 * @description 포트홀 관제 앱의 핵심 상태를 관리하는 커스텀 훅
 */
const usePotholeStore = create<PotholeState & PotholeActions>((set) => ({
  // 초기 상태: 탐지 중지, 광주 기본 좌표
  isTracking: false,
  currentLocation: { lat: 35.1595, lng: 126.8526 },

  /** 탐지 상태 변경 (시작/중지) */
  setIsTracking: (val) => set({ isTracking: val }),

  /** 실시간 GPS 좌표 갱신 */
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
}));

export default usePotholeStore;