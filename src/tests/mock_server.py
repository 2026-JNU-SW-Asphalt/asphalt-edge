from fastapi import FastAPI, File, UploadFile, Form
from typing import Optional
import json

app = FastAPI()

@app.post("/api/v1/stream/frames")
async def receive_frame(
    header: str = Form(...), 
    # frame을 Optional로 변경하고 기본값을 None으로 설정합니다.
    frame: Optional[UploadFile] = File(None) 
):
    # 1. 메타데이터 파싱
    header_json = json.loads(header)
    
    # 2. 결과 출력
    print(f"🚀 [수신 성공] 시간: {header_json.get('captured_at')}")
    print(f"📍 위치: {header_json.get('location')}")

    # 3. 이미지 존재 여부에 따른 조건부 출력
    if frame:
        print(f"🖼️ 이미지 파일명: {frame.filename}")
        print(f"📏 이미지 크기: {frame.size} bytes")
    else:
        print("⚠️ 이미지가 전송되지 않았습니다. (메타데이터만 수신)")

    return {
        "status": "success", 
        "message": "Frame processed",
        "has_image": frame is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)