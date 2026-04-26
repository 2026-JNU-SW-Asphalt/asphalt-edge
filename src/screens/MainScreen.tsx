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
import { socketClient } from '../utils/socketClient'; // ✅ 웹소켓 클라이언트 추가
import { styles } from './MainScreen.styles';
import { SHAPE } from '../components/DetectButton.style';
import { OrientationOverlay } from '../components/OrientationOverlay';
import { DebugOverlay } from '../components/DebugOverlay';
import { DetectButton } from '../components/DetectButton';

const CAMERA_ZOOM = 2;
const CAMERA_EXPOSURE = -2;
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
    { fps: 30 },
  ]);

  const cameraRef = useRef<Camera>(null);
  const appState = useRef(AppState.currentState);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [zoom, setZoom] = useState<number | undefined>(undefined);
  const [exposure, setExposure] = useState<number | undefined>(undefined);

  const orientation = useDeviceOrientation();
  const isValidLandscape = orientation === VALID_LANDSCAPE;

  // ✅ 2. Store에서 isConnected 상태 추가 추출
  const { isTracking, setIsTracking, currentLocation, isConnected } = usePotholeStore();

  const { startSampling } = useCameraEngine(cameraRef as React.RefObject<Camera>, isValidLandscape);

  useLocationTracker();

  const handleInitialized = useCallback(() => {
    setZoom(CAMERA_ZOOM);
    setExposure(CAMERA_EXPOSURE);
  }, []);

  const handleButtonPress = useCallback(() => {
    if (isTracking) {
      setIsTracking(false);
    } else if (isValidLandscape) {
      setIsTracking(true);
    }
  }, [isTracking, isValidLandscape, setIsTracking]);

  // 3. 버튼 모양 애니메이션 로직
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

  // 4. 앱 생명주기 및 권한 관리
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

  // 5. 샘플링 및 웹소켓 생명주기 통합 관리
  useEffect(() => {
    if (isTracking) {
      // 탐지 시작: 소켓 연결 후 카메라 프레임 샘플링 시작
      socketClient.connect();
      const stopSampling = startSampling();

      return () => {
        // 탐지 종료(또는 컴포넌트 언마운트): 샘플링 중지 후 소켓 닫기
        stopSampling();
        socketClient.disconnect();
      };
    }
  }, [isTracking, startSampling]);

  // 6. 조건부 렌더링 (권한 확인 중)
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4d79ff" />
        <Text style={styles.loadingText}>시스템 권한 확인 중...</Text>
      </View>
    );
  }

  // 7. 조건부 렌더링 (권한 거부)
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
            exposure={exposure}
            onInitialized={handleInitialized}
            videoStabilizationMode="off"
            photoQualityBalance="speed"
          />
        )}
      </View>

      {/* 오버레이 UI 레이어 */}
      {!isValidLandscape && <OrientationOverlay isTracking={isTracking} />}

      {/* ✅ DebugOverlay에 isConnected 상태 전달 */}
      <DebugOverlay
        lat={currentLocation?.lat}
        lng={currentLocation?.lng}
        isTracking={isTracking}
        isConnected={isConnected}
      />

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
