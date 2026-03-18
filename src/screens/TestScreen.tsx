import React from 'react';
import { View, Button, Alert } from 'react-native';
import usePotholeStore from '../store/usePotholeStore';
import { createPotholeFormData } from '../utils/packetCreator';
import { uploadPotholeFrame } from '../api/streamApi';

/**
 * @component TestScreen
 * @description 통신 및 상태 관리 로직을 검증하기 위한 테스트 화면
 */
const TestScreen = () => {
  const { currentLocation, isTracking, setIsTracking } = usePotholeStore();

  /**
   * @function handleTestUpload
   * @description 더미 데이터를 생성하여 서버로 전송 테스트 수행
   */
  const handleTestUpload = async () => {
    // 1. 더미 메타데이터 생성 (위치 정보가 없을 경우를 대비한 기본값)
    const metadata = {
      location: currentLocation || { lat: 35.1595, lng: 126.8526 },
      captured_at: new Date().toISOString(),
    };

    // 2. 이미지 없이 텍스트 데이터만 전송하는 모드로 설정
    // 실제 파일이 없으므로 null을 전달하여 packetCreator에서 처리하게 함
    const dummyImage = null;

    try {
      // 3. FormData 변환 (이미지가 null이면 메타데이터만 포함됨)
      const formData = createPotholeFormData(metadata, dummyImage);

      console.log('🚀 전송 시도 중...');
      const result = await uploadPotholeFrame(formData);

      if (result) {
        Alert.alert('성공', '데이터가 Mock Server에 도달했습니다.');
      } else {
        Alert.alert('실패', '전송 실패: 서버 응답이 없습니다.');
      }
    } catch (error) {
      console.error('전송 중 예외 발생:', error);
      Alert.alert('에러', `전송 중 문제가 발생했습니다: ${error}`);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button title={isTracking ? '탐지 중지' : '탐지 시작(테스트)'} onPress={() => setIsTracking(!isTracking)} />
      <View style={{ marginVertical: 10 }} />
      <Button title="이미지 없이 데이터만 강제 전송" onPress={handleTestUpload} color="#f194ff" />
    </View>
  );
};

export default TestScreen;
