// imageProcessor.ts

import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';

export const TARGET_SIZE = 640;
const TARGET_HEIGHT_PX   = TARGET_SIZE * 2; // 1280px
const FINAL_WEBP_QUALITY = 80;
const ROTATION_DEGREES   = 270;             // 크롭 직후 회전 (리사이즈와 단일 사이클)

/**
 * 물리적 이미지(landscape) 기준 우측 20%(하늘)를 제거합니다.
 *
 *  x=0              x=width
 *  ┌──────────────┬────┐
 *  │  도로 (사용) │하늘│ ← 오른쪽 20% 제거
 *  └──────────────┴────┘
 *
 * 예) 1280×900: skipX=256 → 사용 영역 1024×900
 */
const getUsableRegion = (width: number, height: number) => {
  const skipX = Math.floor(width * 0.2);
  return { x: 0, y: 0, width: width - skipX, height };
};

/**
 * @function prepareFrameForServer
 * @description 클라이언트 전처리:
 *   1. 우측 20%(하늘) 크롭
 *   2. 90° 회전 + 높이 1280px 리사이징 + WebP 80% 압축 (단일 I/O)
 *
 * 파이프라인 (takeSnapshot 1280×900 기준):
 *   물리 원본(1280×900)
 *   → 크롭(1024×900)
 *   → 90° 회전 + 리사이즈(1125×1280) + WebP 80%
 *   → 서버 전송
 *
 * @param fileUri     - takeSnapshot() 캡처 URI
 * @param imageWidth  - 물리적 원본 너비  (landscape: 1280)
 * @param imageHeight - 물리적 원본 높이  (landscape: 900)
 * @returns 전처리 완료된 단일 WebP 이미지 URI
 */
export const prepareFrameForServer = async (
  fileUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<string> => {

  // Step 1: 우측 20% 크롭 (하늘 제거, 물리 좌표 기준)
  const usable  = getUsableRegion(imageWidth, imageHeight);
  const cropped = await ImageEditor.cropImage(fileUri, {
    offset: { x: usable.x, y: usable.y },
    size:   { width: usable.width, height: usable.height },
  });

  // Step 2: 90° 회전 + 리사이즈 + WebP 압축 (단일 인코딩 사이클)
  //
  // 회전 후 width/height가 교환되므로 scaledW 계산 기준을 변경합니다.
  //   크롭 결과: usable.width × usable.height (예: 1024×900, landscape)
  //   90° 회전:  usable.height × usable.width  (예: 900×1024, portrait)
  //   높이 1280 기준 scaledW: round(900 × (1280/1024)) = 1125
  const scaledW = Math.round(usable.height * (TARGET_HEIGHT_PX / usable.width));
  const result  = await ImageResizer.createResizedImage(
    cropped.uri,
    scaledW,
    TARGET_HEIGHT_PX,
    'WEBP',
    FINAL_WEBP_QUALITY,
    ROTATION_DEGREES,   // 리사이즈와 동일한 사이클에서 회전 처리 (추가 비용 없음)
    undefined,
    false,
  );

  console.log(
    `📦 [전처리] 물리 ${imageWidth}×${imageHeight}`,
    `→ 크롭 ${usable.width}×${usable.height}`,
    `→ 회전+리사이즈 ${scaledW}×${TARGET_HEIGHT_PX} WebP`,
  );

  return result.uri;
};