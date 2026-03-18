import { useCallback, useRef } from 'react';
import { Camera, PhotoFile } from 'react-native-vision-camera';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';
import { tracer } from '../utils/performanceTracer';

/**
 * 샘플링 주기 (333ms = 3 FPS)
 */
const SAMPLE_INTERVAL_MS = 333;

/**
 * 백그라운드 전처리 최대 동시 실행 수
 * 메모리 상황에 따라 2~3개로 조절 가능합니다.
 */
const MAX_CONCURRENT_JOBS = 1;

export const useCameraEngine = (cameraRef: React.RefObject<Camera>, isValidLandscape: boolean) => {
  const isCapturing = useRef(false);
  const activeJobs = useRef(0);

  /**
   * @function handleBackgroundJob
   * @description 촬영 후 전처리(크롭, 압축, 저장)를 백그라운드에서 수행
   */
  const handleBackgroundJob = useCallback(async (photo: PhotoFile, ts: number) => {
    activeJobs.current += 1;

    try {
      const processedUri = await prepareFrameForServer(`file://${photo.path}`, photo.width, photo.height);
      await saveImageToDownloads(processedUri, ts);
    } catch (e) {
      console.error(`[BG-Job] 실패 (TS: ${ts}):`, e);
    } finally {
      activeJobs.current -= 1;
      tracer.end(); // 전처리가 완전히 끝난 시점에 트레이서 종료
    }
  }, []);

  /**
   * @function processFrame
   * @description 메인 샘플링 루프: 촬영 직후 다음 촬영을 위해 플래그 해제
   */
  const processFrame = useCallback(async () => {
    // 1. 촬영 가능 상태 확인 (가로 모드, 현재 촬영 중 여부, 백그라운드 작업 과부하 확인)
    if (!isValidLandscape || isCapturing.current || !cameraRef.current) return;
    if (activeJobs.current >= MAX_CONCURRENT_JOBS) {
      console.warn('⚠️ 전처리 지연으로 인해 프레임 스킵');
      return;
    }

    tracer.start('FRAME_PROCESS');
    isCapturing.current = true;
    const timestamp = Date.now();

    try {
      // 2. 물리적 촬영 수행 (하드웨어 점유)
      const photo = await cameraRef.current.takePhoto({
        enableShutterSound: false,
        flash: 'off',
      });

      // 3. 촬영 직후 즉시 플래그 해제 (다음 setInterval이 촬영을 시작할 수 있게 함)
      isCapturing.current = false;

      // 4. 전처리는 비동기로 던짐 (await 하지 않음)
      handleBackgroundJob(photo, timestamp);
    } catch (e) {
      console.error('📸 촬영 실패:', e);
      isCapturing.current = false;
      tracer.end();
    }
  }, [cameraRef, isValidLandscape, handleBackgroundJob]);

  const startSampling = useCallback(() => {
    const id = setInterval(processFrame, SAMPLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [processFrame]);

  return { startSampling };
};
