import RNFS from 'react-native-fs';

/**
 * 파일 경로 컨벤션
 * - 수신: 절대경로 (file:// 없음)
 * - RNFS.copyFile: 절대경로 그대로 사용
 */
const TARGET_DIR = `${RNFS.DownloadDirectoryPath}/asphalt`;

let dirReady = false;

const ensureDir = async (): Promise<void> => {
  if (dirReady) return;
  if (!(await RNFS.exists(TARGET_DIR))) {
    await RNFS.mkdir(TARGET_DIR);
  }
  dirReady = true;
};

/**
 * @param filePath  절대경로 (file:// 없음)
 */
export const saveImageToDownloads = async (filePath: string, timestamp: number) => {
  try {
    const downloadDir = `${RNFS.DownloadDirectoryPath}/asphalt`;

    if (!(await RNFS.exists(downloadDir))) {
      await RNFS.mkdir(downloadDir);
    }

    const destPath = `${downloadDir}/frame_${timestamp}.jpg`; // .webp → .jpg
    await RNFS.copyFile(filePath, destPath);

    console.log(`📁 저장 완료: ${destPath}`);
  } catch (error) {
    console.error('❌ 디버그 이미지 저장 실패:', error);
  }
};
