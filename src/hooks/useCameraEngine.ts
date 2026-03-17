import { useCallback, useRef } from 'react';
import { Camera } from 'react-native-vision-camera';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';

/**
 * 샘플링 주기 (333ms = 3 FPS)
 */
const SAMPLE_INTERVAL_MS = 333;

export const useCameraEngine = (cameraRef: React.RefObject<Camera>, isValidLandscape: boolean) => {
  const isProcessing = useRef(false);

  const processFrame = useCallback(async () => {
    // 잘못된 방향이거나 이전 처리 중이면 건너뜀
    if (!isValidLandscape || isProcessing.current || !cameraRef.current) return;

    isProcessing.current = true;
    const timestamp = Date.now();

    try {
      const photo = await cameraRef.current.takePhoto({ enableShutterSound: false });

      console.log(`📷 [${timestamp}] ${photo.width}×${photo.height}`);

      const processedUri = await prepareFrameForServer(`file://${photo.path}`, photo.width, photo.height);

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
