import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { styles } from './DebugOverlay.style';

interface Props {
  lat?: number;
  lng?: number;
  isTracking: boolean;
}

/**
 * 실시간 위치 및 탐지 상태를 표시하는 디버그 오버레이입니다.
 */
export const DebugOverlay = ({ lat, lng, isTracking }: Props) => (
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
  </View>
);
