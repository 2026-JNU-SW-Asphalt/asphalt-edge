import RNFS from 'react-native-fs';

/**
 * WebP 파일을 Download/asphalt 폴더에 복사한다. (디버그용)
 * copyFile 방식으로 JS 힙에 파일 내용을 올리지 않는다.
 * 원본 파일 삭제는 호출자 책임이다.
 */
export const saveImageToDownloads = async (filePath: string, timestamp: number): Promise<void> => {
  const targetDir = `${RNFS.DownloadDirectoryPath}/asphalt`;
  const ext = filePath.split('.').pop() ?? 'webp';
  const destPath = `${targetDir}/frame_${timestamp}.${ext}`;

  if (!(await RNFS.exists(targetDir))) {
    await RNFS.mkdir(targetDir);
  }

  await RNFS.copyFile(filePath, destPath);
  console.log(`📁 [Debug] 저장 완료: ${destPath}`);
};
