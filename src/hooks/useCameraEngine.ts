import { useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { shouldProcessFrame } from '../utils/frameSampler';
import { processAndEncodeImage } from '../utils/imageProcessor';
import { saveImageToDownloads } from '../utils/debugStorage';

type CameraRefType = any;

export const useCameraEngine = (cameraRef: CameraRefType) => {
  const lastTimestamp = useSharedValue<number>(0);

  const processFrameOnJS = useCallback(async (timestamp: number) => {
    try {
      if (!cameraRef.current) return;

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      // ── 해상도 검증 로그 ──────────────────────────────────────────────────
      // 정상(9:16): 4000×2252 → 타일 8장
      // 비정상(4:3): 4000×3000 → 타일 6장
      // 이 로그로 실제 촬영 해상도를 확인하세요.
      console.log(`📷 [${timestamp}] photo: ${photo.width}×${photo.height}`);

      const aspectRatio = photo.width / photo.height;
      const expected = 16 / 9;
      const tolerance = 0.05;

      if (Math.abs(aspectRatio - expected) > tolerance) {
        console.warn(
          `⚠️ 비율 불일치: 실제 ${aspectRatio.toFixed(3)} / 기대 ${expected.toFixed(3)}`,
          '→ cameraFormat에 photoAspectRatio: 16/9 조건을 추가하세요.',
        );
      }
      // ─────────────────────────────────────────────────────────────────────

      const fileUri = `file://${photo.path}`;

      const tileUris: string[] = await processAndEncodeImage(
        fileUri,
        photo.width,
        photo.height,
      );

      console.log(`✅ [${timestamp}] 전처리 완료: 640×640 타일 ${tileUris.length}장`);

      // 디버그: 타일 전체 Downloads 저장
      await Promise.allSettled(
        tileUris.map((uri, index) =>
          saveImageToDownloads(uri, `${timestamp}_${index}`),
        ),
      );

    } catch (e) {
      console.log('이미지 변환 에러 건너뜀 (Fail-Fast)', e);
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