import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const FINAL_WEBP_QUALITY = 100;
const ROTATION_DEGREES   = 0;

const OUTPUT_HEIGHT = 1280;

const getUsableRegion = (width: number, height: number) => {
  const skipLeft  = Math.floor(width * 0.10);
  return {
    x: 0,
    y: skipLeft,
    width,
    height: OUTPUT_HEIGHT,
  };
};

/**
 * @function prepareFrameForServer
 * @param fileUri     - takeSnapshot() 캡처 URI
 * @param imageWidth  - 물리적 원본 너비  (2160)
 * @param imageHeight - 물리적 원본 높이  (3840)
 * @returns 전처리 완료된 단일 WebP 이미지 URI (3840×1280)
 */
export const prepareFrameForServer = async (
  fileUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<string> => {

  const usable  = getUsableRegion(imageWidth, imageHeight);
  const cropped = await ImageEditor.cropImage(fileUri, {
    offset: { x: usable.x, y: usable.y },
    size:   { width: usable.width, height: usable.height },
  });

  const result = await ImageResizer.createResizedImage(
    cropped.uri,
    usable.height,  // 회전 후 width = 크롭 height (3840)
    usable.width,   // 회전 후 height = 크롭 width  (1280)
    'WEBP',
    FINAL_WEBP_QUALITY,
    ROTATION_DEGREES,
    undefined,
    false,
    {
      onlyScaleDown: true,
    }
  );

  console.log(
    `📦 [전처리] 물리 ${imageWidth}×${imageHeight}`,
    `→ 크롭 ${usable.width}×${usable.height}`,
    `→ 회전 ${usable.height}×${usable.width} WebP ${FINAL_WEBP_QUALITY}%`,
  );

  return result.uri;
};