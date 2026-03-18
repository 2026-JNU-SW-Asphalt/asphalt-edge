import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import MainScreen from './src/screens/MainScreen';

/**
 * @component App
 * @description 광주형 AI 포트홀 우선보수 관제 플랫폼 EdgeApp의 메인 엔트리포인트
 */
const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* 상태바를 어두운 배경에 맞게 설정 */}
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 3주차에 작성한 메인 관제 화면 렌더링 */}
      <MainScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // 카메라 프리뷰와의 일질감을 위해 검은색 배경 설정
  },
});

export default App;