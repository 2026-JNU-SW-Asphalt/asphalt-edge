import { useCallback, useRef } from 'react';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';
import { SAMPLE_INTERVAL_MS } from '../utils/frameSampler';

type CameraRefType = any;

export const useCameraEngine = (
  cameraRef: CameraRefType,
  isValidLandscape: boolean,  // ← 추가: 올바른 가로 모드 여부
) => {
  const isProcessing = useRef(false);

  const processFrame = useCallback(async () => {
    // 올바른 가로 모드가 아니면 촬영 건너뜀 (isTracking 상태는 유지)
    if (!isValidLandscape) return;
    if (isProcessing.current || !cameraRef.current) return;
    isProcessing.current = true;

    const timestamp = Date.now();
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
        qualityPrioritization: 'balanced',
      });

      console.log(`📷 [${timestamp}] ${photo.width}×${photo.height}`);

      const processedUri = await prepareFrameForServer(
        `file://${photo.path}`,
        photo.width,
        photo.height,
      );

      console.log(`✅ [${timestamp}] 서버 전송 준비 완료`);
      await saveImageToDownloads(processedUri, timestamp);

    } catch (e) {
      console.error('프레임 처리 실패 (건너뜀):', e);
    } finally {
      isProcessing.current = false;
    }
  }, [cameraRef, isValidLandscape]);

  const startSampling = useCallback(() => {
    const id = setInterval(processFrame, SAMPLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [processFrame]);

  return { startSampling };
};