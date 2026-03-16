import ImageEditor from '@react-native-community/image-editor';
import ImageResizer from '@bam.tech/react-native-image-resizer';

/**
 * @constant TARGET_SIZE
 * @description YOLOv11 모델의 표준 입력 규격 (640x640)
 */
export const TARGET_SIZE = 640;

/**
 * @function getCropConfig
 * @description 16:9 프레임에서 중앙 1:1 영역(도로면 집중)을 추출하기 위한 좌표 계산 [cite: 86-87]
 * @param {number} width - 원본 프레임 가로 폭
 * @param {number} height - 원본 프레임 세로 높이
 */
export const getCropConfig = (width: number, height: number) => {
  'worklet';
  // 가로 모드(Landscape) 기준: 세로 길이만큼을 가로 중앙에서 떼어냅니다.
  const sideLength = height; 
  const x = (width - height) / 2;
  const y = 0;

  return { x, y, width: sideLength, height: sideLength };
};

/**
 * @function processAndEncodeImage
 * @description 저장된 원본 이미지를 Center Crop 후 640x640 JPEG로 리사이징합니다.
 * @param {string} fileUri - Vision Camera가 임시 저장한 파일의 URI
 * @param {object} cropData - getCropConfig로 계산된 크롭 좌표 데이터
 * @returns {Promise<string>} 변환이 완료된 이미지의 새로운 URI
 */
export const processAndEncodeImage = async (
  fileUri: string, 
  cropData: { x: number, y: number, width: number, height: number }
): Promise<string> => {
  try {
    // 1. Center Crop 실행 (16:9 -> 1:1)
    const cropConfig = {
      offset: { x: cropData.x, y: cropData.y },
      size: { width: cropData.width, height: cropData.height },
    };
    const cropResult = await ImageEditor.cropImage(fileUri, cropConfig);

    // 2. 리사이징 및 JPEG 압축 (1:1 -> 640x640, Quality 0.6) [cite: 84-85, 89-90]
    const resizedImage = await ImageResizer.createResizedImage(
      cropResult.uri,
      TARGET_SIZE, // 640
      TARGET_SIZE, // 640
      'JPEG',      // 전송 효율을 위한 포맷
      60,          // 품질 계수 0.6 (60%)
      0,           // 회전 없음
      undefined,   // 임시 폴더 저장
      false        // keepMeta (메타데이터 유지 안 함)
    );

    return resizedImage.uri;

  } catch (error) {
    console.error("❌ 이미지 전처리 실패:", error);
    throw error;
  }
};