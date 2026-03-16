/**
 * @function getCropConfig
 * @description 16:9 프레임에서 중앙 1:1 영역을 추출하기 위한 좌표를 계산합니다.
 * @param {number} width - 원본 프레임 가로 폭
 * @param {number} height - 원본 프레임 세로 높이
 */
export const getCropConfig = (width: number, height: number) => {
  'worklet';
  // 가로가 세로보다 긴 Landscape 상황 가정 (16:9)
  const sideLength = height; 
  const x = (width - height) / 2;
  const y = 0;

  return { x, y, width: sideLength, height: sideLength };
};

/**
 * @constant TARGET_SIZE
 * @description YOLOv11 모델의 표준 입력 규격
 */
export const TARGET_SIZE = 640;