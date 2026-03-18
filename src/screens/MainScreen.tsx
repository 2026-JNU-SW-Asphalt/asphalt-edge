import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useCameraDevices, useCameraFormat, Camera } from 'react-native-vision-camera';

/* Custom Hooks & Store */
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

/* Utils & Components */
import { requestHardwarePermissions, openAppSettings, checkPermissionStatus } from '../utils/permission';
import { styles } from './MainScreen.styles';
import { SHAPE } from '../components/DetectButton.style';
import { OrientationOverlay } from '../components/OrientationOverlay';
import { DebugOverlay } from '../components/DebugOverlay';
import { DetectButton } from '../components/DetectButton';

const CAMERA_ZOOM = 2;
const VALID_LANDSCAPE = 'LANDSCAPE-LEFT';

const MainScreen = () => {
  // 1. 카메라 장치 및 포맷 설정
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const cameraFormat = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
    { photoResolution: { width: 1920, height: 1080 } },
    { videoAspectRatio: 16 / 9 },
    { photoAspectRatio: 16 / 9 },
  ]);

  // 2. Ref 및 상태 관리
  // [TS 해결] 엔진이 null을 허용하지 않는 경우를 대비해 Type Assertion 적용
  const cameraRef = useRef<Camera>(null);
  const appState = useRef(AppState.currentState);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [zoom, setZoom] = useState<number | undefined>(undefined);

  // 3. 커스텀 훅 연결
  const orientation = useDeviceOrientation();
  const isValidLandscape = orientation === VALID_LANDSCAPE;
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();

  // 엔진 시작 (cameraRef 타입을 강제하여 ts(2345) 해결)
  const { startSampling } = useCameraEngine(cameraRef as React.RefObject<Camera>, isValidLandscape);

  useLocationTracker();

  // 4. 이벤트 핸들러
  const handleInitialized = useCallback(() => setZoom(CAMERA_ZOOM), []);

  const handleButtonPress = useCallback(() => {
    if (isTracking) {
      setIsTracking(false);
    } else if (isValidLandscape) {
      setIsTracking(true);
    }
  }, [isTracking, isValidLandscape, setIsTracking]);

  // 5. 애니메이션 로직
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: isTracking ? 1 : 0,
      useNativeDriver: false,
      speed: 1,
    }).start();
  }, [isTracking, anim]);

  const animatedSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHAPE.circle.size, SHAPE.square.size],
  });
  const animatedRadius = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHAPE.circle.radius, SHAPE.square.radius],
  });

  // 6. 생명주기 및 권한 관리
  useEffect(() => {
    Orientation.lockToPortrait();

    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        setHasPermission(await checkPermissionStatus());
      }
      appState.current = next;
    });

    (async () => setHasPermission(await requestHardwarePermissions()))();

    return () => {
      Orientation.unlockAllOrientations();
      sub.remove();
    };
  }, []);

  // 샘플링 실행 제어
  useEffect(() => {
    if (isTracking) return startSampling();
  }, [isTracking, startSampling]);

  // 7. 조건부 렌더링 (권한 확인 중)
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4d79ff" />
        <Text style={styles.loadingText}>시스템 권한 확인 중...</Text>
      </View>
    );
  }

  // 8. 조건부 렌더링 (권한 거부)
  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>🚫</Text>
        <Text style={styles.errorText}>권한이 필요합니다</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
          <Text style={styles.buttonText}>설정에서 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 프리뷰 레이어 */}
      <View style={styles.cameraWrapper}>
        {device && (
          <Camera
            ref={cameraRef}
            style={{ flex: 1 }}
            device={device}
            isActive={true}
            photo={true}
            video={true}
            pixelFormat="yuv"
            format={cameraFormat}
            zoom={zoom}
            onInitialized={handleInitialized}
            videoStabilizationMode="off"
            exposure={-1}
            photoQualityBalance="speed"
          />
        )}
      </View>

      {/* 오버레이 UI 레이어 */}
      {!isValidLandscape && <OrientationOverlay isTracking={isTracking} />}

      <DebugOverlay lat={currentLocation?.lat} lng={currentLocation?.lng} isTracking={isTracking} />

      <DetectButton
        isTracking={isTracking}
        isValidLandscape={isValidLandscape}
        animatedSize={animatedSize}
        animatedRadius={animatedRadius}
        onPress={handleButtonPress}
      />
    </View>
  );
};

export default MainScreen;
