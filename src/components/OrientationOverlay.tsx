import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './OrientationOverlay.style';

interface Props {
  isTracking: boolean;
}

/**
 * 기기가 유효한 가로 모드가 아닐 때 표시되는 dim 오버레이입니다.
 * 촬영 중에는 터치를 하위 버튼으로 통과시킵니다.
 */
export const OrientationOverlay = ({ isTracking }: Props) => (
  <View style={styles.dim} pointerEvents={isTracking ? 'none' : 'auto'}>
    <Text style={styles.icon}>🔄</Text>
    <Text style={styles.text}>
      {isTracking
        ? '기기를 시계방향으로\n회전해주세요\n\n(촬영이 일시 중단됩니다)'
        : '기기를 시계방향으로\n회전해주세요'}
    </Text>
  </View>
);
