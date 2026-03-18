import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const FINAL_WEBP_QUALITY = 100;
const OUTPUT_HEIGHT = 1280;

const getUsableRegion = (width: number, height: number) => {
  const skipLeft = Math.floor(width * 0.10);
  return {
    x: 0,
    y: skipLeft,
    width,
    height: OUTPUT_HEIGHT,
  };
};

/**
 * @function prepareFrameForServer
 * @param fileUri     - takePhoto() 캡처 URI
 * @param imageWidth  - 원본 너비  (가로 모드: 4000)
 * @param imageHeight - 원본 높이  (가로 모드: 2252)
 * @returns 전처리 완료된 단일 WebP 이미지 URI
 */
export const prepareFrameForServer = async (
  fileUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<string> => {

  // 크롭
  const usable  = getUsableRegion(imageWidth, imageHeight);
  const cropped = await ImageEditor.cropImage(fileUri, {
    offset: { x: usable.x, y: usable.y },
    size:   { width: usable.width, height: usable.height },
  });

  // WebP 압축 (회전 없음, 크기 유지)
  const result = await ImageResizer.createResizedImage(
    cropped.uri,
    usable.width,   // 원본 width 그대로
    usable.height,  // 원본 height 그대로
    'WEBP',
    FINAL_WEBP_QUALITY,
    0,              // 회전 없음
    undefined,
    false,
    { onlyScaleDown: true },
  );

  console.log(
    `📦 [전처리] 물리 ${imageWidth}×${imageHeight}`,
    `→ 크롭 ${usable.width}×${usable.height} WebP ${FINAL_WEBP_QUALITY}%`,
  );

  return result.uri;
};