import { useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { shouldProcessFrame } from '../utils/frameSampler';
import { getCropConfig } from '../utils/imageProcessor';

export const useCameraEngine = () => {
  const lastTimestamp = useSharedValue<number>(0);

  const processFrameOnJS = (timestamp: number) => {
    console.log(`📸 전처리 및 전송 준비: ${timestamp}`);
  };

  const runProcessFrame = useRunOnJS(processFrameOnJS, [processFrameOnJS]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = Date.now();

    if (shouldProcessFrame(now, lastTimestamp.value)) {
      lastTimestamp.value = now;
      const crop = getCropConfig(frame.width, frame.height); 
      runProcessFrame(now); 
    }
  }, [lastTimestamp, runProcessFrame]);

  return { frameProcessor };
};