import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

const WEBP_QUALITY = 70;
const CROP_HEIGHT = 640;

const toUri = (path: string) => `file://${path}`;
const toPath = (uri: string) => uri.replace('file://', '');

// 1080 -> Top < 325|640|116 > Bottom
const getCropConfig = (width: number, height: number) => ({
  offset: { x: 0, y: Math.floor(height * 0.3) },
  size: { width, height: CROP_HEIGHT },
});

/**
 * crop + resize 수행 후 WebP 파일 경로(절대경로)를 반환한다.
 */
export const prepareFrameForServer = async (
  filePath: string,
  imageWidth: number,
  imageHeight: number,
): Promise<string> => {
  const cropConfig = getCropConfig(imageWidth, imageHeight);
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
