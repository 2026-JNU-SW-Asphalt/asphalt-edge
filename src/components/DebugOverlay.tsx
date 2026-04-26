import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './DebugOverlay.style';

// ✅ 1. Props 인터페이스에 isConnected 속성 추가
interface Props {
  lat?: number;
  lng?: number;
  isTracking: boolean;
  isConnected: boolean;
}

/**
 * 실시간 위치, 탐지 상태 및 웹소켓 연결 상태를 표시하는 디버그 오버레이입니다.
 */
// ✅ 2. 매개변수로 isConnected를 구조 분해 할당으로 받음
export const DebugOverlay = ({ lat, lng, isTracking, isConnected }: Props) => (
  <View style={styles.container}>
    <Text style={styles.title}>GWANGJU AI CONTROL</Text>
    <View style={styles.divider} />

    <Text style={styles.label}>
      LAT: <Text style={styles.value}>{lat?.toFixed(6) ?? '0.000000'}</Text>
    </Text>

    <Text style={styles.label}>
      LNG: <Text style={styles.value}>{lng?.toFixed(6) ?? '0.000000'}</Text>
    </Text>

    <Text style={[styles.status, { color: isTracking ? '#00ff00' : '#ffcc00' }]}>
      STATUS: {isTracking ? 'RUNNING' : 'IDLE'}
    </Text>

    {/* ✅ 3. 웹소켓 연결 상태 UI 추가 */}
    <Text style={[styles.status, { color: isConnected ? '#00ff00' : '#ff4d4d', marginTop: 2 }]}>
      SOCKET: {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}
    </Text>
  </View>
);
