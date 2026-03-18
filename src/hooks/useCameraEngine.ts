import { useCallback, useRef } from 'react';
import { Camera, PhotoFile } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import usePotholeStore from '../store/usePotholeStore';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';

/**
 * 파일 경로 컨벤션
 * - photo.path: VisionCamera가 반환하는 절대경로 (file:// 없음)
 * - 모든 내부 경로: 절대경로 (file:// 없음)
 * - RNFS.unlink: 절대경로 직접 수용
 */
const SAMPLE_INTERVAL_MS = 333;
const MAX_CONCURRENT_PHOTOS = 2;
const MAX_CONCURRENT_JOBS = 2;

interface CapturedFrame {
  photo: PhotoFile;
  location: { lat: number; lng: number } | null;
  timestamp: number;
}

export const useCameraEngine = (cameraRef: React.RefObject<Camera>, isValidLandscape: boolean) => {
  const { currentLocation } = usePotholeStore();
  const activePhotos = useRef(0);
  const activeJobs = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBackgroundJob = useCallback(async (frame: CapturedFrame) => {
    const { photo, location, timestamp } = frame;
    let resizedPath: string | null = null;

    try {
      // ✅ photo.path: 절대경로 그대로 전달
      resizedPath = await prepareFrameForServer(photo.path, photo.width);

      // ✅ resizedPath: 절대경로 그대로 전달
      await saveImageToDownloads(resizedPath, timestamp);

      // 복사 완료 즉시 삭제
      await RNFS.unlink(resizedPath).catch(() => {});
      resizedPath = null;

      // await sendToServer(resizedPath, timestamp, location);
    } catch (e) {
    } finally {
      // ✅ photo.path, resizedPath 모두 절대경로 → RNFS.unlink 직접 수용
      await RNFS.unlink(photo.path).catch(() => {});
      if (resizedPath) await RNFS.unlink(resizedPath).catch(() => {});
      activeJobs.current -= 1;
    }
  }, []);

  const processFrame = useCallback(async () => {
    if (!isValidLandscape || !cameraRef.current) return;
    if (activePhotos.current >= MAX_CONCURRENT_PHOTOS) return;
    if (activeJobs.current >= MAX_CONCURRENT_JOBS) return;

    const timestamp = Date.now();
    const locationSnapshot = currentLocation ? { ...currentLocation } : null;

    // ✅ finally로 이동: 성공/실패/예외 무관하게 항상 해제
    activePhotos.current += 1;

    try {
      const photo = await cameraRef.current.takePhoto({
        enableShutterSound: false,
        flash: 'off',
      });

      // ✅ activeJobs 증가: 던지기 직전 (레이스 컨디션 방지)
      if (activeJobs.current < MAX_CONCURRENT_JOBS) {
        activeJobs.current += 1;
        handleBackgroundJob({ photo, location: locationSnapshot, timestamp });
      } else {
        // ✅ photo.path: 절대경로 그대로 사용
        await RNFS.unlink(photo.path).catch(() => {});
      }
    } catch (e) {
    } finally {
      // ✅ activePhotos 감소: finally에서 항상 보장
      activePhotos.current -= 1;
    }
  }, [cameraRef, isValidLandscape, currentLocation, handleBackgroundJob]);

  const startSampling = useCallback(() => {
    const scheduleNext = () => {
      timerRef.current = setTimeout(async () => {
        await processFrame();
        scheduleNext();
      }, SAMPLE_INTERVAL_MS);
    };

    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [processFrame]);

  return { startSampling };
};
