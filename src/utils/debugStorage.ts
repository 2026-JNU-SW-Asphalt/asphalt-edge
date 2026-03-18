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
export const saveImageToDownloads = async (filePath: string, timestamp: number): Promise<void> => {
  await ensureDir();
  const ext = filePath.split('.').pop() ?? 'webp';
  const destPath = `${TARGET_DIR}/frame_${timestamp}.${ext}`;
  // ✅ RNFS.copyFile은 절대경로 직접 수용
  await RNFS.copyFile(filePath, destPath);
};
