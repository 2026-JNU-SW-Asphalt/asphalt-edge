import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { requestHardwarePermissions, openAppSettings, checkPermissionStatus } from '../utils/permission';

/**
 * @component MainScreen
 * @description 광주형 AI 포트홀 관제 플랫폼의 메인 화면. 
 * 카메라 프리뷰, 실시간 GPS 정보, 그리고 Phase 2의 핵심인 프레임 샘플링 엔진을 통합합니다.
 */
const MainScreen = () => {
  // 1. 하드웨어 상태 및 데이터 관리
  const device = useCameraDevice('back');
  
  // Phase 2: 프레임 샘플링 엔진 (3~5 FPS 추출 로직 포함)
  const { frameProcessor } = useCameraEngine();
  
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // AppState 상태 추적을 위한 ref
  const appState = useRef(AppState.currentState);

  // 2. 실시간 GPS 추적 훅 실행 (1Hz 갱신)
  useLocationTracker();

  /**
   * @function checkOnlyStatus
   * @description 앱이 활성화될 때 조용히 권한 상태만 업데이트합니다.
   */
  const checkOnlyStatus = async () => {
    const result = await checkPermissionStatus();
    setHasPermission(result);
  };

  /**
   * @function initialPermissionRequest
   * @description 앱 최초 실행 시 전체 권한 요청을 수행합니다.
   */
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

  /**
   * @description 권한 요청 중일 때 표시할 로딩 화면
   */
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4d79ff" />
        <Text style={styles.loadingText}>시스템 권한 확인 중...</Text>
      </View>
    );
  }

  /**
   * @description 권한 거절 시 표시할 예외 처리 화면
   */
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
      {/* [Phase 2 핵심 변경사항]
        - frameProcessor: isTracking 상태일 때만 샘플링 엔진 가동
        - pixelFormat: Android 환경에서 하드웨어 가속에 가장 효율적인 'yuv' 포맷 사용
        - videoStabilizationMode: 주행 중 진동에 의한 초점 흔들림 방지를 위해 'off' (광학 고정 보조)
      */}
      {device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={isTracking ? frameProcessor : undefined}
          pixelFormat="yuv"
          videoStabilizationMode="off"
          enableLocation={true}
        />
      )}

      {/* 실시간 디버그 오버레이 (상단) */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>GWANGJU AI CONTROL</Text>
        <View style={styles.divider} />
        <Text style={styles.debugLabel}>LAT: <Text style={styles.debugValue}>{currentLocation.lat.toFixed(6)}</Text></Text>
        <Text style={styles.debugLabel}>LNG: <Text style={styles.debugValue}>{currentLocation.lng.toFixed(6)}</Text></Text>
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

// 스타일 시트는 기존 규격 유지
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