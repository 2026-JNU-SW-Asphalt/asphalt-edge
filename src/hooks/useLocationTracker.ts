import { useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
import usePotholeStore from '../store/usePotholeStore';

const GPS_INTERVAL_MS = 1000; // 1Hz

/**
 * 탐지 중일 때만 1Hz 주기로 GPS 위치를 추적하여 전역 상태를 업데이트합니다.
 */
export const useLocationTracker = () => {
  const { setCurrentLocation, isTracking } = usePotholeStore();

  useEffect(() => {
    if (!isTracking) return;

    const watchId = Geolocation.watchPosition(
      ({ coords }) => setCurrentLocation({ lat: coords.latitude, lng: coords.longitude }),
      (error) => console.error('GPS Error:', error),
      { enableHighAccuracy: true, distanceFilter: 0, interval: GPS_INTERVAL_MS },
    );

    return () => Geolocation.clearWatch(watchId);
  }, [isTracking, setCurrentLocation]);
};
