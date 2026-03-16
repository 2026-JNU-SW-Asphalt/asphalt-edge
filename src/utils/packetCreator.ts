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

  // 이미지 바이너리를 'frame' 키에 추가
  formData.append('frame', {
    uri: imageFile.uri,
    type: 'image/jpeg',
    name: 'pothole.jpg',
  } as any);

  return formData;
};