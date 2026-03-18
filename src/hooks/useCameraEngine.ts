import { useCallback, useRef } from 'react';
import { Camera, PhotoFile } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import usePotholeStore from '../store/usePotholeStore';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';

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
      resizedPath = await prepareFrameForServer(photo.path, photo.width, photo.height);

      // Debug: 이미지 로컬 저장
      await saveImageToDownloads(resizedPath, timestamp);
      // await sendToServer(resizedPath, timestamp, location);

      await RNFS.unlink(resizedPath).catch(() => {});
      resizedPath = null;
    } catch (e) {
    } finally {
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

    activePhotos.current += 1;

    try {
      const photo = await cameraRef.current.takePhoto({
        enableShutterSound: false,
        flash: 'off',
      });

      if (activeJobs.current < MAX_CONCURRENT_JOBS) {
        activeJobs.current += 1;
        handleBackgroundJob({ photo, location: locationSnapshot, timestamp });
      } else {
        await RNFS.unlink(photo.path).catch(() => {});
      }
    } catch (e) {
    } finally {
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
