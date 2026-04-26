import usePotholeStore from '../store/usePotholeStore';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect: boolean = false;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.shouldReconnect = true;

    // 이미 연결되어 있거나 연결 중이면 무시
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('🟢 WebSocket Connected');
      usePotholeStore.getState().setIsConnected(true);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    };

    this.ws.onclose = () => {
      console.log('🔴 WebSocket Disconnected');
      usePotholeStore.getState().setIsConnected(false);
      this.ws = null;

      // 탐지 중(shouldReconnect)인데 끊겼다면 3초 후 자동 재연결
      if (this.shouldReconnect) {
        console.log('🔄 소켓 재연결 시도 중...');
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket Error:', error);
      this.ws?.close(); // 에러 발생 시 close 이벤트를 강제 호출하여 재연결 로직 태움
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * @description 프레임 전송 (연결 끊김 시 자동 Drop)
   */
  sendFrame(base64Image: string, gps: { lat: number; lng: number; accuracy?: number }, timestamp: number) {
    // ⚠️ 연결되지 않은 상태면 데이터 버림 (Fail-Fast)
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('⚠️ 소켓 미연결. 프레임을 드롭합니다.');
      return;
    }

    const isoTimestamp = new Date(timestamp).toISOString();

    const payload = {
      image: `data:image/webp;base64,${base64Image}`,
      timestamp: isoTimestamp,
      gps: gps,
    };

    try {
      this.ws.send(JSON.stringify(payload));
      usePotholeStore.getState().incrementSequence(); // 전송 성공 시 시퀀스 증가
      console.log(`🚀 프레임 전송 성공: ${isoTimestamp}`);
    } catch (error) {
      console.error('❌ 전송 실패. 프레임을 드롭합니다.', error);
    }
  }
}

// TODO: 실제 서버의 WebSocket URL로 변경해야 합니다. (로컬 테스트 시 ws://본인아이피:포트)
export const socketClient = new WebSocketClient('ws://172.30.1.40:8000');
