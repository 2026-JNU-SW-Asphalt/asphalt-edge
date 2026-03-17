import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ActivityIndicator, AppState, AppStateStatus, Dimensions,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useCameraDevices, useCameraFormat, Camera } from 'react-native-vision-camera';
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { requestHardwarePermissions, openAppSettings, checkPermissionStatus } from '../utils/permission';

const { width: SCREEN_W } = Dimensions.get('window');

const CAMERA_W = SCREEN_W;
const CAMERA_H = SCREEN_W * (16 / 9);

const BUTTON_SIZE = 72;
const BUTTON_HALF = BUTTON_SIZE / 2;

const BUTTON_POS = {
  bottom: 50,
  left: SCREEN_W / 2 - BUTTON_HALF,
};

// 내부 도형의 시작(원)과 끝(사각형) 값
const SHAPE = {
  circle: { size: 26, radius: 13 },
  square: { size: 46, radius: 8  },
};

const MainScreen = () => {
  const devices = useCameraDevices();
  const device =
    devices.find(d => d.position === 'back' && d.physicalDevices.includes('ultra-wide-angle-camera')) ||
    devices.find(d => d.position === 'back');

  const cameraFormat = useCameraFormat(device, [
    { videoAspectRatio: 16 / 9 },
    { photoResolution: 'max' },
    { videoResolution: 'max' },
  ]);

  const cameraRef = useRef<Camera>(null);
  const { frameProcessor } = useCameraEngine(cameraRef);
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);

  useLocationTracker();

  // ── 애니메이션 값: 0 = 원(idle), 1 = 사각형(tracking) ──────────────────
  const anim = useRef(new Animated.Value(0)).current;

  // isTracking 변경 시 애니메이션 실행
  useEffect(() => {
    Animated.spring(anim, {
      toValue: isTracking ? 1 : 0,
      useNativeDriver: false, // width/height/borderRadius는 Native Driver 미지원
      speed: 1,
    }).start();
  }, [isTracking]);

  // 세 가지 속성을 각각 보간
  const animatedSize = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [SHAPE.circle.size, SHAPE.square.size],
  });
  const animatedRadius = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [SHAPE.circle.radius, SHAPE.square.radius],
  });

  // ────────────────────────────────────────────────────────────────────────

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

      {/* 카메라 */}
      <View style={styles.cameraWrapper}>
        {device && (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            frameProcessor={isTracking ? frameProcessor : undefined}
            pixelFormat="yuv"
            videoStabilizationMode="off"
            enableLocation={true}
            format={cameraFormat}
            zoom={device.minZoom}
            enableZoomGesture={true}
          />
        )}
      </View>

      {/* 디버그 오버레이 */}
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

      {/* 탐지 버튼 */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.mainButton}
        onPress={() => setIsTracking(!isTracking)}
      >
        {/* Animated.View로 size와 borderRadius를 부드럽게 보간 */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { width: CAMERA_W, height: CAMERA_H },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 20 },
  errorIcon: { fontSize: 50, marginBottom: 20 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subText: { color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  loadingText: { color: '#fff', marginTop: 15 },
  settingsButton: { backgroundColor: '#4d79ff', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  debugOverlay: {
    position: 'absolute', top: 60, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', padding: 15,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  debugTitle: { color: '#4d79ff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 8 },
  debugLabel: { color: '#fff', fontSize: 13, marginBottom: 4 },
  debugValue: { color: '#00ffff', fontWeight: '500' },
  statusText: { fontSize: 15, fontWeight: 'bold', marginTop: 5 },
  mainButton: {
    position: 'absolute',
    bottom: BUTTON_POS.bottom,
    left: BUTTON_POS.left,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_HALF,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  // 색상만 고정, 크기·radius는 Animated로 제어
  innerShape: {
    backgroundColor: '#e0000f',
  },
});

export default MainScreen;