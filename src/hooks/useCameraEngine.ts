import { useCallback, useRef } from 'react';
import { Camera, PhotoFile } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import usePotholeStore from '../store/usePotholeStore';
import { prepareFrameForServer } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';
import { tracer } from '../utils/performanceTracer';

const SAMPLE_INTERVAL_MS = 300;
const MAX_CONCURRENT_PHOTOS = 2; // 실측 검증된 파이프라인 동시 허용 수
const MAX_CONCURRENT_JOBS = 2; // 전처리 동시 허용 수

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

  /**
   * 전처리 + 저장/전송을 백그라운드에서 수행한다.
   * photo 파일은 처리 완료 또는 실패 시 반드시 삭제한다.
   */
  const handleBackgroundJob = useCallback(async (frame: CapturedFrame) => {
    activeJobs.current += 1;
    const { photo, location, timestamp } = frame;
    let resizedPath: string | null = null;

    try {
      tracer.start('FRAME_PROCESS');

      console.log(
        `[Job] 처리 시작 - TS: ${timestamp}, ` + `위치: ${location?.lat ?? 'N/A'}, ${location?.lng ?? 'N/A'}`,
      );

      // 1. 전처리: crop + resize → 파일 경로 반환 (JS 힙 관여 없음)
      resizedPath = await prepareFrameForServer(`file://${photo.path}`, photo.width);

      // 2. 로컬 저장 (서버 준비 완료 시 sendToServer로 교체)
      await saveImageToDownloads(resizedPath, timestamp);

      // 3. 서버 전송 (서버 준비 완료 시 주석 해제)
      // await sendToServer(resizedPath, timestamp, location);

      console.log(`[Job] 완료 - TS: ${timestamp}`);
    } catch (e) {
      console.error(`[Job] 실패 - TS: ${timestamp}:`, e);
    } finally {
      // 원본 photo 파일 삭제
      await RNFS.unlink(photo.path).catch(() => {});
      // resized 파일 삭제 (saveImageToDownloads가 copyFile 방식이므로 안전)
      if (resizedPath) await RNFS.unlink(resizedPath).catch(() => {});
      activeJobs.current -= 1;
      tracer.end();
    }
  }, []);

  const processFrame = useCallback(async () => {
    if (!isValidLandscape || !cameraRef.current) return;

    // 세마포어: 실측 검증된 동시 촬영 허용 수
    if (activePhotos.current >= MAX_CONCURRENT_PHOTOS) return;

    // 전처리 과부하 방어
    if (activeJobs.current >= MAX_CONCURRENT_JOBS) {
      console.warn('⚠️ 전처리 지연으로 인해 프레임 스킵');
      return;
    }

    // 촬영 시점의 위치를 즉시 고정 (takePhoto 소요 시간 동안 변경되는 것 방지)
    const timestamp = Date.now();
    const locationSnapshot = currentLocation ? { ...currentLocation } : null;

    activePhotos.current += 1;

    try {
      const photo = await cameraRef.current.takePhoto({
        enableShutterSound: false,
        flash: 'off',
      });

      const frameData: CapturedFrame = {
        photo,
        location: locationSnapshot,
        timestamp,
      };

      if (activeJobs.current < MAX_CONCURRENT_JOBS) {
        // fire-and-forget: await 하지 않음 → 다음 촬영 즉시 가능
        handleBackgroundJob(frameData);
      } else {
        // 전처리 슬롯 없음 → photo 파일만 삭제하고 폐기
        console.warn('⚠️ Job 슬롯 없음으로 프레임 폐기');
        await RNFS.unlink(photo.path).catch(() => {});
      }
    } catch (e) {
      console.error('📸 촬영 실패:', e);
    } finally {
      // 성공/실패 무관하게 항상 세마포어 해제
      activePhotos.current -= 1;
    }
  }, [cameraRef, isValidLandscape, currentLocation, handleBackgroundJob]);

  /**
   * 재귀 setTimeout: processFrame 완료 후 다음 주기 예약
   * setInterval 대비 콜백 중첩 원천 차단
   */
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
