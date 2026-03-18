import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ActivityIndicator, AppState, AppStateStatus, StyleSheet,
} from 'react-native';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import { useCameraDevices, useCameraFormat, Camera } from 'react-native-vision-camera';
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { requestHardwarePermissions, openAppSettings, checkPermissionStatus } from '../utils/permission';
import { styles, SHAPE } from './MainScreen.styles';

const CAMERA_ZOOM = 2;

/**
 * 유효한 가로 모드 정의:
 *   기기를 시계방향으로 회전 = LANDSCAPE-LEFT
 *   (물리적 기기 하단이 UI 왼쪽에 위치)
 */
const VALID_LANDSCAPE: OrientationType = OrientationType["LANDSCAPE-LEFT"];

const MainScreen = () => {
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  const cameraFormat = useCameraFormat(device, [
    { videoResolution: { width: 3840, height: 2160 } },
    { photoResolution: { width: 3840, height: 2160 } },
    { videoAspectRatio: 16 / 9 },
    { photoAspectRatio: 16 / 9 },
    { photoResolution: 'max' },
  ]);

  useEffect(() => {
    if (!cameraFormat) return;
    console.log('✅ 선택된 포맷:', {
      photo: `${cameraFormat.photoWidth}×${cameraFormat.photoHeight}`,
      video: `${cameraFormat.videoWidth}×${cameraFormat.videoHeight}`,
      fps:   `${cameraFormat.minFps}~${cameraFormat.maxFps}`,
    });
  }, [cameraFormat]);

  const cameraRef = useRef<Camera>(null);

  // 올바른 가로 모드 여부 (시계방향 회전 = LANDSCAPE-LEFT만 유효)
  const [isValidLandscape, setIsValidLandscape] = useState<boolean>(false);

  /**
   * isValidLandscape를 useCameraEngine에 전달:
   *   - true:  실제 촬영 수행
   *   - false: 촬영 건너뜀 (isTracking 상태는 유지)
   */
  const { startSampling } = useCameraEngine(cameraRef, isValidLandscape);
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);
  const [zoom, setZoom] = useState<number | undefined>(undefined);

  const handleInitialized = useCallback(() => {
    setZoom(CAMERA_ZOOM);
  }, []);

  useLocationTracker();

  useEffect(() => {
    if (!isTracking) return;
    const stop = startSampling();
    return stop;
  }, [isTracking, startSampling]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: isTracking ? 1 : 0,
      useNativeDriver: false,
      speed: 1,
    }).start();
  }, [isTracking]);

  const animatedSize = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [SHAPE.circle.size, SHAPE.square.size],
  });
  const animatedRadius = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [SHAPE.circle.radius, SHAPE.square.radius],
  });

  useEffect(() => {
    Orientation.lockToPortrait();

    // 물리적 기기 방향 감지 (UI는 Portrait 고정 유지)
    const handleOrientation = (o: OrientationType) => {
      setIsValidLandscape(o === VALID_LANDSCAPE);
    };
    Orientation.addDeviceOrientationListener(handleOrientation);

    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        setHasPermission(await checkPermissionStatus());
      }
      appState.current = next;
    });

    (async () => setHasPermission(await requestHardwarePermissions()))();

    return () => {
      Orientation.removeDeviceOrientationListener(handleOrientation);
      Orientation.unlockAllOrientations();
      sub.remove();
    };
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4d79ff" />
        <Text style={styles.loadingText}>시스템 권한 확인 중...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>🚫</Text>
        <Text style={styles.errorText}>권한이 필요합니다</Text>
        <Text style={styles.subText}>
          정확한 포트홀 위치 기록을 위해{"\n"}카메라와 위치 권한이 필수입니다.
        </Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
          <Text style={styles.buttonText}>설정에서 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

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
            videoStabilizationMode="off"
            enableLocation={true}
            format={cameraFormat}
            zoom={zoom}
            resizeMode="cover"
            onInitialized={handleInitialized}
            exposure={-1}
            photoQualityBalance="balanced"
          />
        )}
      </View>

      {/* 가로 모드가 아닐 때 dim 오버레이 */}
      {!isValidLandscape && (
        <View
          style={overlayStyles.dim}
          pointerEvents={isTracking ? 'none' : 'auto'}
        >
          <Text style={overlayStyles.dimIcon}>🔄</Text>
          <Text style={overlayStyles.dimText}>
            {isTracking
              ? '기기를 시계방향으로\n회전해주세요\n\n(촬영이 일시 중단됩니다)'
              : '기기를 시계방향으로\n회전해주세요'}
          </Text>
        </View>
      )}

      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>GWANGJU AI CONTROL</Text>
        <View style={styles.divider} />
        <Text style={styles.debugLabel}>
          LAT: <Text style={styles.debugValue}>{currentLocation?.lat?.toFixed(6) || '0.000000'}</Text>
        </Text>
        <Text style={styles.debugLabel}>
          LNG: <Text style={styles.debugValue}>{currentLocation?.lng?.toFixed(6) || '0.000000'}</Text>
        </Text>
        <Text style={[styles.statusText, { color: isTracking ? '#00ff00' : '#ffcc00' }]}>
          STATUS: {isTracking ? 'RUNNING' : 'IDLE'}
        </Text>
      </View>

      {/* 탐지 버튼: 가로 모드 여부에 따라 색상 변경 */}
      <TouchableOpacity
        activeOpacity={isValidLandscape || isTracking ? 0.8 : 1}
        style={[
          styles.mainButton,
          (!isValidLandscape && !isTracking) && overlayStyles.buttonDisabled,
        ]}
        onPress={() => {
          if (isTracking) {
            setIsTracking(false);
            return;
          }
          if (!isValidLandscape) return;
          setIsTracking(true);
        }}
      >
        <Animated.View
          style={[
            styles.innerShape,
            (!isValidLandscape && !isTracking) && overlayStyles.innerShapeDisabled,
            {
              width:        animatedSize,
              height:       animatedSize,
              borderRadius: animatedRadius,
            },
          ]}
        />
      </TouchableOpacity>

    </View>
  );
};

// 오버레이 및 비활성 버튼 스타일
const overlayStyles = StyleSheet.create({
  // 화면 전체 dim 오버레이
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dimIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  dimText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  // 비활성 버튼 외곽 (연한 회색)
  buttonDisabled: {
    backgroundColor: '#d0d0d0',
    borderColor: '#b0b0b0',
  },
  // 비활성 버튼 내부 도형 (진한 회색)
  innerShapeDisabled: {
    backgroundColor: '#888',
  },
});

export default MainScreen;