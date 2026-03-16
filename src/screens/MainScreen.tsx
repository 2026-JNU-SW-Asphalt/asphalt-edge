import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { requestHardwarePermissions } from '../utils/permission';

/**
 * @component MainScreen
 * @description 카메라 프리뷰와 실시간 위치 정보를 표시하는 관제 메인 화면
 */
const MainScreen = () => {
  const device = useCameraDevice('back'); // 후면 카메라 사용 [cite: 29]
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();
  const [hasPermission, setHasPermission] = useState(false);

  // GPS 추적 시작
  useLocationTracker();

  useEffect(() => {
    requestHardwarePermissions().then(setHasPermission);
  }, []);

  if (!hasPermission || !device) return <View style={styles.container}><Text>권한 요청 중...</Text></View>;

  return (
    <View style={styles.container}>
      {/* 1. 카메라 프리뷰 레이어 [cite: 172] */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />

      {/* 2. 디버그 오버레이 (상단) [cite: 248, 252] */}
      <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>📍 Lat: {currentLocation.lat.toFixed(6)}</Text>
        <Text style={styles.debugText}>📍 Lng: {currentLocation.lng.toFixed(6)}</Text>
        <Text style={styles.statusText}>상태: {isTracking ? '🛰️ 탐지 및 전송 중' : '💤 대기 중'}</Text>
      </View>

      {/* 3. 제어 버튼 (하단) [cite: 143] */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isTracking ? '#ff4d4d' : '#4d79ff' }]}
        onPress={() => setIsTracking(!isTracking)}
      >
        <Text style={styles.buttonText}>{isTracking ? '탐지 종료' : '탐지 시작'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  debugOverlay: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 },
  debugText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statusText: { color: '#00ff00', fontSize: 16, marginTop: 5 },
  button: { position: 'absolute', bottom: 50, alignSelf: 'center', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default MainScreen;