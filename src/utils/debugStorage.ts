import RNFS from 'react-native-fs';

const TARGET_DIR = `${RNFS.DownloadDirectoryPath}/asphalt`;

// ✅ 디렉토리 존재 확인을 최초 1회만 수행
let dirReady = false;

const ensureDir = async (): Promise<void> => {
  if (dirReady) return;
  if (!(await RNFS.exists(TARGET_DIR))) {
    await RNFS.mkdir(TARGET_DIR);
  }
  dirReady = true;
};

/**
 * filePath: file:// 없는 절대경로
 * WebP 파일을 Download/asphalt 폴더에 복사한다.
 */
export const saveImageToDownloads = async (filePath: string, timestamp: number): Promise<void> => {
  await ensureDir();
  const ext = filePath.split('.').pop() ?? 'webp';
  const destPath = `${TARGET_DIR}/frame_${timestamp}.${ext}`;
  await RNFS.copyFile(filePath, destPath);
};
