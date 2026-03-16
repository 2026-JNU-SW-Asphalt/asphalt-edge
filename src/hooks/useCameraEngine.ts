import { useRef, useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { shouldProcessFrame } from '../utils/frameSampler';

/**
 * @function useCameraEngine
 * @description 카메라 프레임을 샘플링하여 처리하는 핵심 엔진 훅
 */
export const useCameraEngine = () => {
  const lastTimestamp = useRef<number>(0);

  /**
   * @function processFrameOnJS
   * @description Worklet 외부(JS 스레드)에서 실행될 로직 (로그 출력 등)
   */
  const processFrameOnJS = useCallback((timestamp: number) => {
    console.log(`📸 프레임 캡처 성공: ${timestamp}`);
    // 여기서 다음 단계인 'Step 2: 전처리'로 데이터를 넘기게 됩니다.
  }, []);

  /**
   * @worklet
   * @description GPU 스레드에서 실행되는 고속 프레임 처리기
   */
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = Date.now();

    if (shouldProcessFrame(now, lastTimestamp.current)) {
      lastTimestamp.current = now;
      
      // 실제 데이터 전송 및 무거운 작업은 JS 스레드나 별도 Worklet으로 위임
      runOnJS(processFrameOnJS)(now);
    }
  }, []);

  return { frameProcessor };
};