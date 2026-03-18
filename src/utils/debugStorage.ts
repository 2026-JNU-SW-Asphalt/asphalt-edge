import RNFS from 'react-native-fs';

/**
 * 전처리된 WebP 이미지를 Download/asphalt 폴더에 복사합니다. (디버그용)
 */
export const saveImageToDownloads = async (fileUri: string, timestamp: number) => {
  try {
    const targetDir = `${RNFS.DownloadDirectoryPath}/asphalt`;
    const destPath = `${targetDir}/frame_${timestamp}.webp`;

    // 폴더 존재 확인 및 생성
    if (!(await RNFS.exists(targetDir))) {
      await RNFS.mkdir(targetDir);
    }

    await RNFS.copyFile(fileUri, destPath);
    console.log(`📁 Debug saved: ${destPath}`);
  } catch (e) {
    console.error('❌ Debug save failed:', e);
  }
};
