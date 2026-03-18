/**
 * @class PerformanceTracer
 * @description 작업별 소요 시간 및 실행 간격(Interval) 측정 도구
 */
class PerformanceTracer {
  private lastCallTime: number = 0;
  private startTime: number = 0;
  private label: string = '';

  /**
   * 측정 시작 및 이전 실행과의 간격 출력
   */
  start(label: string) {
    const now = Date.now();
    this.label = label;
    this.startTime = now;

    if (this.lastCallTime > 0) {
      const interval = now - this.lastCallTime;
      const fps = (1000 / interval).toFixed(1);
      console.log(`\n[${label}] 🔄 실행 간격: ${interval}ms (${fps} FPS)`);
    }
    this.lastCallTime = now;
  }

  /**
   * 특정 단계의 소요 시간 측정
   */
  step(stepName: string) {
    const elapsed = Date.now() - this.startTime;
    console.log(`   └─ 🕒 ${stepName}: +${elapsed}ms`);
  }

  /**
   * 전체 작업 완료
   */
  end() {
    const total = Date.now() - this.startTime;
    console.log(`   #️⃣ 전체 처리 소요: ${total}ms`);
  }
}

export const tracer = new PerformanceTracer();
