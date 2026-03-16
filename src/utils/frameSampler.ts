/**
 * @function shouldProcessFrame
 * @description 현재 타임스탬프를 기반으로 프레임 처리 여부를 결정합니다. (3~5 FPS)
 * @param {number} now - 현재 시간 (ms)
 * @param {number} lastProcessedTime - 마지막으로 처리된 시간 (ms)
 * @returns {boolean} 처리 대상 여부
 */
export const shouldProcessFrame = (now: number, lastProcessedTime: number): boolean => {
  const INTERVAL = 333; // 약 3 FPS 기준 (333ms)
  return now - lastProcessedTime >= INTERVAL;
};