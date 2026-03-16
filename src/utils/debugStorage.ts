import RNFS from 'react-native-fs';

/**
 * @function saveImageToDownloads
 * @description (디버그용) 내부 캐시의 이미지를 스마트폰의 Download/asphalt 폴더로 복사합니다.
 * @param {string} fileUri - 복사할 원본 파일의 URI (file://...)
 * @param {number} timestamp - 파일명 충돌을 막기 위한 타임스탬프
 */
export const saveImageToDownloads = async (fileUri: string, timestamp: number) => {
  try {
    // 안드로이드 공용 다운로드 폴더 내 asphalt 디렉토리 경로
    const downloadDir = `${RNFS.DownloadDirectoryPath}/asphalt`;

    // 1. asphalt 폴더가 없으면 생성
    const dirExists = await RNFS.exists(downloadDir);
    if (!dirExists) {
      await RNFS.mkdir(downloadDir);
    }

    // 2. 새로운 파일 경로 지정 (예: frame_1773686476218.jpg)
    const destPath = `${downloadDir}/frame_${timestamp}.jpg`;

    // 3. 내부 캐시 파일을 다운로드 폴더로 복사
    await RNFS.copyFile(fileUri, destPath);
    
    console.log(`📁 다운로드 폴더 저장 완료: ${destPath}`);
  } catch (error) {
    console.error('❌ 디버그 이미지 저장 실패:', error);
  }
};