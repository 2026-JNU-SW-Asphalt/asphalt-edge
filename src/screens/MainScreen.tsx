import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { useCameraDevice, useCameraFormat, Camera } from 'react-native-vision-camera';
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { requestHardwarePermissions, openAppSettings, checkPermissionStatus } from '../utils/permission';

/**
 * @component MainScreen
 * @description 광주형 AI 포트홀 관제 플랫폼의 메인 화면. 
 * [Phase 2 적용] 초광각 렌즈 선정, 가로 모드 촬영, 샘플링 엔진이 통합된 버전입니다.
 */
const MainScreen = () => {
  const device = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera']
  });
  
  const cameraFormat = useCameraFormat(device, [
    { videoAspectRatio: 16 / 9 },
    { videoResolution: 'max' }
  ]);
  
  // [메트로놈 아키텍처 반영 1] 카메라 제어를 위한 ref 생성
  const cameraRef = useRef<Camera>(null);

  // [메트로놈 아키텍처 반영 2] 생성한 cameraRef를 엔진(Hook)으로 전달
  const { frameProcessor } = useCameraEngine(cameraRef);
  
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const appState = useRef(AppState.currentState);

  useLocationTracker();

  const checkOnlyStatus = async () => {
    const result = await checkPermissionStatus();
    setHasPermission(result);
  };

  const initialPermissionRequest = async () => {
    const result = await requestHardwarePermissions();
    setHasPermission(result);
  };

  useEffect(() => {
    initialPermissionRequest();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkOnlyStatus();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
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
      {device && (
        <Camera
          ref={cameraRef} // [메트로놈 아키텍처 반영 3] ref 연결
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true} // [메트로놈 아키텍처 반영 3] takePhoto 호출을 위해 반드시 true로 설정
          frameProcessor={isTracking ? frameProcessor : undefined}
          pixelFormat="yuv"
          videoStabilizationMode="off"
          enableLocation={true}
          format={cameraFormat}
        />
      )}

      {/* 실시간 디버그 오버레이 (상단) */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>GWANGJU AI CONTROL</Text>
        <View style={styles.divider} />
        <Text style={styles.debugLabel}>LAT: <Text style={styles.debugValue}>{currentLocation?.lat?.toFixed(6) || '0.000000'}</Text></Text>
        <Text style={styles.debugLabel}>LNG: <Text style={styles.debugValue}>{currentLocation?.lng?.toFixed(6) || '0.000000'}</Text></Text>
        <Text style={[styles.statusText, { color: isTracking ? '#00ff00' : '#ffcc00' }]}>
          STATUS: {isTracking ? 'RUNNING' : 'IDLE'}
        </Text>
      </View>

      {/* 탐지 제어 버튼 (하단) */}
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[styles.mainButton, { backgroundColor: isTracking ? '#ff4d4d' : '#4d79ff' }]}
        onPress={() => setIsTracking(!isTracking)}
      >
        <Text style={styles.mainButtonText}>
          {isTracking ? '탐지 종료' : '탐지 시작'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 20 },
  errorIcon: { fontSize: 50, marginBottom: 20 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subText: { color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  loadingText: { color: '#fff', marginTop: 15 },
  settingsButton: { backgroundColor: '#4d79ff', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  debugOverlay: { 
    position: 'absolute', 
    top: 60, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    padding: 15, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  debugTitle: { color: '#4d79ff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 8 },
  debugLabel: { color: '#fff', fontSize: 13, marginBottom: 4 },
  debugValue: { color: '#00ffff', fontWeight: '500' },
  statusText: { fontSize: 15, fontWeight: 'bold', marginTop: 5 },
  mainButton: { 
    position: 'absolute', 
    bottom: 50, 
    alignSelf: 'center', 
    paddingVertical: 18, 
    paddingHorizontal: 50, 
    borderRadius: 35,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65
  },
  mainButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default MainScreen;