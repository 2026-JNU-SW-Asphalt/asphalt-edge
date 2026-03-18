/**
 * @typedef {Object} LocationData
 * @description 스마트폰 GPS에서 취득한 위경도 정보
 * @property {number} lat - 위도 (Latitude)
 * @property {number} lng - 경도 (Longitude)
 */
export interface LocationData {
  lat: number;
  lng: number;
}

/**
 * @typedef {Object} PotholePacket
 * @description 서버로 전송할 최소 단위의 데이터 패킷
 * @property {LocationData} location - 포트홀 발견 위치
 * @property {string} captured_at - ISO 8601 형식의 캡처 시간
 */
export interface PotholePacket {
  location: LocationData;
  captured_at: string;
}

/**
 * @typedef {Object} PotholeState
 * @description 앱의 전역 상태 인터페이스
 * @property {boolean} isTracking - 현재 포트홀 탐지 및 전송 중인지 여부
 * @property {LocationData} currentLocation - 실시간 GPS 위치 정보
 */
export interface PotholeState {
  isTracking: boolean;
  currentLocation: LocationData;
}

/**
 * @typedef {Object} PotholeActions
 * @description 상태를 변경하는 함수들의 인터페이스
 */
export interface PotholeActions {
  setIsTracking: (val: boolean) => void;
  setCurrentLocation: (loc: LocationData) => void;
}
