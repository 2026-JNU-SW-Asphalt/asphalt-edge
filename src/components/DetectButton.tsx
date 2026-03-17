import React from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { SHAPE, styles } from './DetectButton.style';

interface Props {
  isTracking: boolean;
  isValidLandscape: boolean;
  animatedSize: Animated.AnimatedInterpolation<number>;
  animatedRadius: Animated.AnimatedInterpolation<number>;
  onPress: () => void;
}

/**
 * 탐지 시작/중지 버튼입니다.
 * 대기 중 + 잘못된 방향일 때 비활성화됩니다.
 * 촬영 중에는 방향과 무관하게 중지 가능합니다.
 */
export const DetectButton = ({ isTracking, isValidLandscape, animatedSize, animatedRadius, onPress }: Props) => {
  const isDisabled = !isTracking && !isValidLandscape;

  return (
    <TouchableOpacity
      activeOpacity={isDisabled ? 1 : 0.8}
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}>
      <Animated.View
        style={[
          styles.inner,
          isDisabled && styles.innerDisabled,
          { width: animatedSize, height: animatedSize, borderRadius: animatedRadius },
        ]}
      />
    </TouchableOpacity>
  );
};
