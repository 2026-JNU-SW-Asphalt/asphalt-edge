import { useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
import usePotholeStore from '../store/usePotholeStore';

/**
 * @function useLocationTracker
 * @description 1Hz 주기로 GPS 위치를 추적하여 전역 상태를 업데이트합니다.
 */
export const useLocationTracker = () => {
  const { setCurrentLocation, isTracking } = usePotholeStore();

  useEffect(() => {
    if (!isTracking) return; // 탐지 중일 때만 GPS 작동 [cite: 82]

    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => console.log('GPS Error:', error),
      { enableHighAccuracy: true, distanceFilter: 0, interval: 1000 } // 1Hz 갱신 [cite: 68]
    );

    return () => Geolocation.clearWatch(watchId);
  }, [isTracking, setCurrentLocation]);
};