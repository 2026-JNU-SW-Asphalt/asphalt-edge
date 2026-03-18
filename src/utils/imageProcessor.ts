import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';

/* 전처리 설정 */
const WEBP_QUALITY = 80;
const CROP_HEIGHT = 1280;

/**
 * 원본 이미지에서 분석에 사용할 영역(중앙/노면)을 계산합니다.
 */
const getCropConfig = (width: number) => ({
  offset: {
    x: 0,
    y: Math.floor(width * 0.1),
  },
  size: {
    width,
    height: CROP_HEIGHT,
  },
});

/**
 * 캡처된 원본 이미지에 대해 전처리(크롭 및 WebP 변환)를 수행합니다.
 */
export const prepareFrameForServer = async (
  fileUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<string> => {
  const cropConfig = getCropConfig(imageWidth);

  // 1. 노면 위주 영역 크롭
  const cropped = await ImageEditor.cropImage(fileUri, cropConfig);

  // 2. WebP 포맷 변환 및 압축
  const { uri } = await ImageResizer.createResizedImage(
    cropped.uri,
    cropConfig.size.width,
    cropConfig.size.height,
    'WEBP',
    WEBP_QUALITY,
    0,
    undefined,
    false,
    { onlyScaleDown: true },
  );

  console.log(`📦 [Pre-process] ${imageWidth}px -> WebP ${CROP_HEIGHT}px (Success)`);
  return uri;
};
