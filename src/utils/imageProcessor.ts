import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

const WEBP_QUALITY = 80;
const CROP_HEIGHT = 1280;

/**
 * 파일 경로 컨벤션
 * - 모든 경로: file:// 없는 절대경로
 * - file:// 부착: 네이티브 API(ImageEditor, ImageResizer) 호출 직전에만
 * - RNFS API: 절대경로 그대로 사용 가능
 */
const toUri = (path: string) => `file://${path}`;
const toPath = (uri: string) => uri.replace('file://', '');

const getCropConfig = (width: number) => ({
  offset: { x: 0, y: Math.floor(width * 0.1) },
  size: { width, height: CROP_HEIGHT },
});

/**
 * crop + resize 수행 후 WebP 파일 경로(절대경로)를 반환한다.
 */
export const prepareFrameForServer = async (filePath: string, imageWidth: number): Promise<string> => {
  const cropConfig = getCropConfig(imageWidth);
  let croppedPath: string | null = null;

  try {
    const cropped = await ImageEditor.cropImage(toUri(filePath), cropConfig);
    croppedPath = toPath(cropped.uri);

    const { uri: resizedUri } = await ImageResizer.createResizedImage(
      toUri(croppedPath),
      cropConfig.size.width,
      cropConfig.size.height,
      'WEBP',
      WEBP_QUALITY,
      0,
      undefined,
      false,
      { onlyScaleDown: true },
    );

    await RNFS.unlink(croppedPath);
    croppedPath = null;

    return toPath(resizedUri);
  } finally {
    if (croppedPath) await RNFS.unlink(croppedPath).catch(() => {});
  }
};
