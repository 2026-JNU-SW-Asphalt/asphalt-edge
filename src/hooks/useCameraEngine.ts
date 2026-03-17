import { useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { shouldProcessFrame, SAMPLE_INTERVAL_MS } from '../utils/frameSampler';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';

type CameraRefType = any;

export const useCameraEngine = (cameraRef: CameraRefType) => {
  const lastTimestamp = useSharedValue<number>(0);

  const processFrameOnJS = useCallback(async (timestamp: number) => {
    try {
      if (!cameraRef.current) return;

      const photo = await cameraRef.current.takeSnapshot({
        quality: 100,
        skipMetadata: true,
      });

      // 물리적 치수를 그대로 사용합니다.
      // 논리적 swap을 적용하면 ImageEditor가 물리 픽셀에 잘못된 좌표로 크롭하여
      // 이미지 경계를 초과 → 크롭 결과가 의도치 않은 크기로 클리핑됩니다.
      console.log(`📷 [${timestamp}] ${photo.width}×${photo.height}`);

      const processedUri = await prepareFrameForServer(
        `file://${photo.path}`,
        photo.width,
        photo.height,
      );

      console.log(`✅ [${timestamp}] 서버 전송 준비 완료 (간격: ${SAMPLE_INTERVAL_MS}ms)`);

      await saveImageToDownloads(processedUri, timestamp);

      // TODO: 서버 전송
      // await uploadToServer(processedUri, timestamp);

    } catch (e) {
      console.error('프레임 처리 실패 (건너뜀):', e);
    }
  }, [cameraRef]);

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