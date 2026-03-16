import { useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera'; // CameraFile 제거
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { shouldProcessFrame } from '../utils/frameSampler';
import { getCropConfig, processAndEncodeImage } from '../utils/imageProcessor';

// 컴포넌트(MainScreen)에서 전달받을 Camera Ref의 타입 (임시 지정)
type CameraRefType = any; 

export const useCameraEngine = (cameraRef: CameraRefType) => {
  const lastTimestamp = useSharedValue<number>(0);

  /**
   * @function processFrameOnJS
   * @description 프레임 프로세서의 신호를 받아 JS 스레드에서 실제 촬영 및 전처리를 수행합니다.
   */
  const processFrameOnJS = useCallback(async (timestamp: number, cropData: any) => {
    try {
      console.log(`⏱️ [${timestamp}] 촬영 및 전처리 시작...`);
      
      // 1. JS 스레드에서 Camera Ref를 사용해 아주 빠르게 사진을 찍습니다 (플래시/소리 Off 필수)
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false, // 셔터음 끄기 (빠른 연속 촬영을 위해)
      });

      const fileUri = `file://${photo.path}`;

      // 2. 크롭 및 리사이즈 실행
      const finalImageUri = await processAndEncodeImage(fileUri, cropData);
      
      console.log(`✅ [${timestamp}] 전처리 완료: 640x640 JPEG -> ${finalImageUri}`);
      
      // [TODO] 6주차: 여기서 FormData를 만들고 Axios 전송 큐에 넣게 됩니다.

    } catch (e) {
      console.log('이미지 변환 에러 건너뜀 (Fail-Fast)', e);
    }
  }, [cameraRef]);

  const runProcessFrame = useRunOnJS(processFrameOnJS, [processFrameOnJS]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = Date.now();

    // 1. 3~5 FPS 샘플링 필터 통과 시에만 실행 (타이머 역할)
    if (shouldProcessFrame(now, lastTimestamp.value)) {
      lastTimestamp.value = now;
      
      // 2. 크롭 좌표 계산
      const cropData = getCropConfig(frame.width, frame.height); 

      // 3. JS 스레드에 "지금 찍어!" 라고 신호와 메타데이터만 보냄
      runProcessFrame(now, cropData); 
    }
  }, [lastTimestamp, runProcessFrame]);

  return { frameProcessor };
};