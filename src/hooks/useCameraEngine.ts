import { useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { shouldProcessFrame } from '../utils/frameSampler';

/**
 * @function useCameraEngine
 * @description 카메라 프레임을 샘플링하여 처리하는 핵심 엔진 훅
 */
export const useCameraEngine = () => {
  // useRef → useSharedValue로 교체 (worklet 내부에서 접근 가능)
  const lastTimestamp = useSharedValue<number>(0);

  const processFrameOnJS = useCallback((timestamp: number) => {
    console.log(`📸 프레임 캡처 성공: ${timestamp}`);
  }, []);

  // runOnJS → useRunOnJS로 교체
  const runProcessFrame = useRunOnJS(processFrameOnJS, [processFrameOnJS]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = Date.now();

    if (shouldProcessFrame(now, lastTimestamp.value)) {
      lastTimestamp.value = now;
      runProcessFrame(now);
    }
  }, [lastTimestamp, runProcessFrame]);

  return { frameProcessor };
};