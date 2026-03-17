import { useEffect, useState } from 'react';
import Orientation, { OrientationType } from 'react-native-orientation-locker';

/**
 * 물리적 기기 방향을 감지합니다.
 * UI는 Portrait으로 잠긴 상태에서 센서 기반으로만 방향을 추적합니다.
 */
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<OrientationType>('PORTRAIT' as OrientationType);

  useEffect(() => {
    const handler = (o: OrientationType) => setOrientation(o);
    Orientation.addDeviceOrientationListener(handler);
    return () => Orientation.removeDeviceOrientationListener(handler);
  }, []);

  return orientation;
};
