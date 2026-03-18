import { PotholePacket } from '../types/pothole';

/**
 * @function createPotholeFormData
 * @description 이미지와 메타데이터를 multipart/form-data 형식으로 변환
 * @param {PotholePacket} metadata - 위치 및 시간 정보
 * @param {any} imageFile - 리사이징된 이미지 파일 (ReactNative File 객체)
 * @returns {FormData} 서버 전송용 FormData 객체
 */
export const createPotholeFormData = (metadata: PotholePacket, imageFile: any): FormData => {
  const formData = new FormData();

  // 메타데이터를 'header' 키에 JSON 문자열로 추가
  formData.append('header', JSON.stringify(metadata));

  // 이미지 파일이 존재할 때만 'frame' 키에 추가 (방어적 코드)
  if (imageFile && imageFile.uri) {
    formData.append('frame', {
      uri: imageFile.uri,
      type: 'image/jpeg',
      name: 'pothole.jpg',
    } as any);
    console.log('✅ FormData에 이미지가 포함되었습니다.');
  } else {
    console.log('⚠️ 이미지 없이 메타데이터만 FormData에 포함되었습니다.');
  }

  return formData;
};