import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

const WEBP_QUALITY = 80;
const CROP_HEIGHT = 1280;

const getCropConfig = (width: number) => ({
  offset: { x: 0, y: Math.floor(width * 0.1) },
  size: { width, height: CROP_HEIGHT },
});

/**
 * crop + resize 수행 후 WebP 파일 경로를 반환한다.
 * 중간 임시 파일(crop 결과)은 resize 완료 즉시 삭제한다.
 * 반환된 파일 경로의 삭제는 호출자 책임이다.
 */
export const prepareFrameForServer = async (fileUri: string, imageWidth: number): Promise<string> => {
  const cropConfig = getCropConfig(imageWidth);
  let croppedPath: string | null = null;

  try {
    // 1. 크롭
    const cropped = await ImageEditor.cropImage(fileUri, cropConfig);
    croppedPath = cropped.uri.replace('file://', '');

    // 2. WebP 리사이즈
    const { uri: resizedUri } = await ImageResizer.createResizedImage(
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

    // 3. 크롭 중간 파일 즉시 삭제
    await RNFS.unlink(croppedPath);
    croppedPath = null;

    console.log(`📦 [Pre-process] ${imageWidth}px → WebP ${CROP_HEIGHT}px`);
    return resizedUri.replace('file://', '');
  } finally {
    // 예외 발생 시 크롭 중간 파일 잔존 방지
    if (croppedPath) await RNFS.unlink(croppedPath).catch(() => {});
  }
};
