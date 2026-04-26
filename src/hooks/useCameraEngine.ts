import { useCallback, useRef } from 'react';
import { Camera } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import usePotholeStore from '../store/usePotholeStore';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';
import { socketClient } from '../utils/socketClient';

const SAMPLE_INTERVAL_MS = 333;
const MAX_CONCURRENT_PHOTOS = 2;
const MAX_CONCURRENT_JOBS = 2;

// 타입을 any로 열어두어 의존성 충돌 방지
interface CapturedFrame {
  photo: any;
  location: { lat: number; lng: number } | null;
  timestamp: number;
}

export const useCameraEngine = (cameraRef: React.RefObject<Camera>, isValidLandscape: boolean) => {
  // ❌ 주의: 리렌더링 폭탄을 막기 위해 여기서 currentLocation을 구독하지 않습니다.
  const activePhotos = useRef(0);
  const activeJobs = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ 킬 스위치: 루프의 생사를 결정하는 절대 권한
  const isSamplingRef = useRef<boolean>(false);

  const handleBackgroundJob = useCallback(async (frame: CapturedFrame) => {
    const { photo, location, timestamp } = frame;

    try {
      // 디버그용: 원본 JPEG을 Downloads 폴더로 저장
      // await saveImageToDownloads(photo.path, timestamp);

      const base64Image = await RNFS.readFile(photo.path, 'base64');
      const validGps = location || { lat: 35.1595, lng: 126.8526, accuracy: 0 };
      socketClient.sendFrame(base64Image, validGps, timestamp);
    } catch (e) {
      console.error('이미지 처리 에러:', e);
    } finally {
      await RNFS.unlink(photo.path).catch(() => {});
      activeJobs.current -= 1;
    }
  }, []);

  const processFrame = useCallback(async () => {
    if (!isValidLandscape || !cameraRef.current) return;
    if (activePhotos.current >= MAX_CONCURRENT_PHOTOS) return;
    if (activeJobs.current >= MAX_CONCURRENT_JOBS) return;

    const timestamp = Date.now();
    const locationSnapshot = usePotholeStore.getState().currentLocation;

    activePhotos.current += 1;

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
        enableAutoRedEyeReduction: false,
      });

      if (activeJobs.current < MAX_CONCURRENT_JOBS) {
        activeJobs.current += 1;
        handleBackgroundJob({ photo, location: locationSnapshot, timestamp });
      } else {
        await RNFS.unlink(photo.path).catch(() => {});
      }
    } catch (e) {
      // 카메라 에러 무시 (Fail-Fast)
    } finally {
      activePhotos.current -= 1;
    }
  }, [cameraRef, isValidLandscape, handleBackgroundJob]);

  const startSampling = useCallback(() => {
    isSamplingRef.current = true; // ✅ 루프 시작 선언

    const scheduleNext = () => {
      if (!isSamplingRef.current) return; // ✅ 1차 킬 스위치 방어

      timerRef.current = setTimeout(async () => {
        if (!isSamplingRef.current) return; // ✅ 2차 킬 스위치 방어 (비동기 지연 후)

        await processFrame();

        if (isSamplingRef.current) {
          // ✅ 3차 킬 스위치 방어 (작업 완료 후 다음 예약 전)
          scheduleNext();
        }
      }, SAMPLE_INTERVAL_MS);
    };

    scheduleNext();

    return () => {
      // ✅ 탐지 종료 시 즉각적인 킬 스위치 발동 및 타이머 폭파
      isSamplingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [processFrame]);

  return { startSampling };
};
