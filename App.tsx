import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import TestScreen from './src/screens/TestScreen';

/**
 * @component App
 * @description 앱의 메인 진입점. 
 * 지금은 Phase 1 검증을 위해 TestScreen을 띄우지만, 
 * Phase 2에서는 메인 관제 화면(CameraView)으로 교체될 예정입니다.
 */
const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* 개발 초기 단계에서는 이렇게 테스트 스크린을 직접 렌더링하여 로직을 검증합니다. */}
      <TestScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;