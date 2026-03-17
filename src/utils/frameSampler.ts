/**
 * 샘플링 간격: 333ms = 약 3 FPS
 * useCameraEngine 등 외부에서 참조할 수 있도록 export합니다.
 */
export const SAMPLE_INTERVAL_MS = 333;

/**
 * @function shouldProcessFrame
 * @description 마지막 처리 시각으로부터 SAMPLE_INTERVAL_MS 이상 경과했는지 확인합니다.
 */
export const shouldProcessFrame = (now: number, lastProcessedTime: number): boolean => {
  'worklet';
  return now - lastProcessedTime >= SAMPLE_INTERVAL_MS;
};