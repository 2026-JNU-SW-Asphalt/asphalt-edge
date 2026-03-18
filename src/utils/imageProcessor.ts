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
 * crop + resize 수행 후 WebP 파일 경로(절대경로)를 반환한다.
 * 반환된 파일의 삭제는 호출자 책임이다.
 */
export const prepareFrameForServer = async (filePath: string, imageWidth: number): Promise<string> => {
  const cropConfig = getCropConfig(imageWidth);
  let croppedPath: string | null = null;

  try {
    const cropped = await ImageEditor.cropImage(`file://${filePath}`, cropConfig);
    croppedPath = cropped.uri.replace('file://', '');

    const { uri: resizedUri } = await ImageResizer.createResizedImage(
      `file://${croppedPath}`,
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

    return resizedUri.replace('file://', '');
  } finally {
    if (croppedPath) await RNFS.unlink(croppedPath).catch(() => {});
  }
};
