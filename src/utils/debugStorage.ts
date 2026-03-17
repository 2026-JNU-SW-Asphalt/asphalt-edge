import RNFS from 'react-native-fs';

/**
 * @function saveImageToDownloads
 * @description (디버그용) 서버 전송 직전 상태의 이미지를 Download/asphalt 폴더에 저장합니다.
 *              전처리 결과(WebP)를 그대로 복사하므로 서버 수신 이미지와 동일합니다.
 * @param {string} fileUri  - 복사할 원본 파일 URI (file://...*.webp)
 * @param {number} timestamp - 파일명 충돌 방지용 타임스탬프
 */
export const saveImageToDownloads = async (fileUri: string, timestamp: number) => {
  try {
    const downloadDir = `${RNFS.DownloadDirectoryPath}/asphalt`;

    if (!(await RNFS.exists(downloadDir))) {
      await RNFS.mkdir(downloadDir);
    }

    const destPath = `${downloadDir}/frame_${timestamp}.webp`;
    await RNFS.copyFile(fileUri, destPath);

    console.log(`📁 저장 완료: ${destPath}`);
  } catch (error) {
    console.error('❌ 디버그 이미지 저장 실패:', error);
  }
};