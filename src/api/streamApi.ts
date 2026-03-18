import axios from 'axios';

/** * @constant BASE_URL
 * @description 스트리밍 서버 주소 (로컬 테스트 환경 기준)
 */
const BASE_URL = 'http://10.0.2.2:8000'; // 안드로이드 에뮬레이터에서 로컬 호스트 접근 주소

/**
 * @constant streamClient
 * @description 포트홀 데이터 전송 전용 Axios 인스턴스
 */
const streamClient = axios.create({
  baseURL: BASE_URL,
  timeout: 2000, // 2초 내 응답 없으면 드롭 (네트워크 정체 방지) [cite: 139]
  headers: {
    'Content-Type': 'multipart/form-data', // 이미지 바이너리 전송 표준 [cite: 116]
  },
});

/**
 * @function uploadPotholeFrame
 * @description 완성된 FormData를 서버로 전송
 * @param {FormData} formData - 위치 정보와 이미지가 포함된 데이터
 * @returns {Promise<any>} 서버 응답 결과
 */
export const uploadPotholeFrame = async (formData: FormData) => {
  try {
    const response = await streamClient.post('/api/v1/stream/frames', formData);
    return response.data;
  } catch (error) {
    // 프로토타입 단계이므로 실패 시 재시도하지 않고 로그만 남김 [cite: 161]
    console.log('Frame Drop: 전송 실패 또는 타임아웃');
    return null;
  }
};
