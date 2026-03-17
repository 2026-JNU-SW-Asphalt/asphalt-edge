import { useCallback, useRef } from 'react';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';
import { SAMPLE_INTERVAL_MS } from '../utils/frameSampler';

type CameraRefType = any;

export const useCameraEngine = (cameraRef: CameraRefType) => {
  const isProcessing = useRef(false);

  const processFrame = useCallback(async () => {
    // 이전 처리가 끝나지 않았으면 건너뜀 (중복 실행 방지)
    if (isProcessing.current || !cameraRef.current) return;
    isProcessing.current = true;

    const timestamp = Date.now();
    try {
      const photo = await cameraRef.current.takeSnapshot({
        quality: 100,
        skipMetadata: true,
      });

      console.log(`📷 [${timestamp}] ${photo.width}×${photo.height}`);

      const processedUri = await prepareFrameForServer(
        `file://${photo.path}`,
        photo.width,
        photo.height,
      );

      console.log(`✅ [${timestamp}] 서버 전송 준비 완료`);
      await saveImageToDownloads(processedUri, timestamp);

      // TODO: await uploadToServer(processedUri, timestamp);

    } catch (e) {
      console.error('프레임 처리 실패 (건너뜀):', e);
    } finally {
      isProcessing.current = false;
    }
  }, [cameraRef]);

  /**
   * isTracking 활성 시 호출 → SAMPLE_INTERVAL_MS 간격으로 촬영 시작
   * 반환된 cleanup 함수를 useEffect return에 연결하면 자동 정리됩니다.
   */
  const startSampling = useCallback(() => {
    const id = setInterval(processFrame, SAMPLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [processFrame]);

  return { startSampling };
};