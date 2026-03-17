import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ActivityIndicator, AppState, AppStateStatus, Dimensions,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useCameraDevices, useCameraFormat, Camera } from 'react-native-vision-camera';
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { requestHardwarePermissions, openAppSettings, checkPermissionStatus } from '../utils/permission';
import { styles, SHAPE } from './MainScreen.styles';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

const MainScreen = () => {
  const devices = useCameraDevices();
  const device =
    devices.find(d => d.position === 'back' && d.physicalDevices.includes('ultra-wide-angle-camera')) ||
    devices.find(d => d.position === 'back');

  const cameraFormat = useCameraFormat(device, [
    { videoResolution: { width: SCREEN_H, height: SCREEN_W } },
    { photoAspectRatio: 16 / 9 },
    { videoAspectRatio: 16 / 9 },
    { photoResolution: 'max' },
  ]);

  const cameraRef = useRef<Camera>(null);
  const { startSampling } = useCameraEngine(cameraRef);
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);

  /**
   * zoom 초기값을 undefined로 설정합니다.
   *
   * 문제 원인:
   *   Camera 네이티브 초기화 완료 전, 기본값(1x)으로 프리뷰가 시작됩니다.
   *   초기화 완료(onInitialized) 시점에 zoom prop이 이미 0.6으로 설정되어 있으면
   *   React가 props 변경이 없다고 판단해 re-render를 생략 → zoom 미적용.
   *
   * 해결:
   *   초기값을 undefined로 두고, onInitialized 콜백에서 device.minZoom을 set합니다.
   *   undefined → 0.6 으로 변경 → React가 props 변경으로 인식 → re-render
   *   → 네이티브에 zoom 재전달 → 정상 적용.
   */
  const [zoom, setZoom] = useState<number | undefined>(undefined);

  const handleInitialized = useCallback(() => {
    if (device?.minZoom !== undefined) {
      setZoom(device.minZoom);
    }
  }, [device?.minZoom]);

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
            pixelFormat="rgb"
            videoStabilizationMode="off"
            enableLocation={true}
            format={cameraFormat}
            zoom={zoom}
            enableZoomGesture={true}
            resizeMode="cover"
            onInitialized={handleInitialized}
          />
        )}
      </View>

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

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.mainButton}
        onPress={() => setIsTracking(!isTracking)}
      >
        <Animated.View
          style={[
            styles.innerShape,
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

export default MainScreen;