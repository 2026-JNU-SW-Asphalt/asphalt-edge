import { PotholePacket } from '../types/pothole';

interface ImageFile {
  uri: string;
}

/**
 *  위치 메타데이터와 WebP 이미지를 FormData로 변환합니다.
 */
export const createPotholeFormData = (metadata: PotholePacket, imageFile: ImageFile | null): FormData => {
  const formData = new FormData();

  // JSON 메타데이터 추가
  formData.append('header', JSON.stringify(metadata));

  // 이미지 존재 시 WebP 형식으로 첨부
  if (imageFile?.uri) {
    formData.append('frame', {
      uri: imageFile.uri,
      type: 'image/webp', // WebP 일관성 유지
      name: `pothole_${Date.now()}.webp`,
    } as any);
  }

  return formData;
};
