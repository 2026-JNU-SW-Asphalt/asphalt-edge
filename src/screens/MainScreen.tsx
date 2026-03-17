import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ActivityIndicator, AppState, AppStateStatus,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useCameraDevices, useCameraFormat, Camera } from 'react-native-vision-camera';
import usePotholeStore from '../store/usePotholeStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCameraEngine } from '../hooks/useCameraEngine';
import { requestHardwarePermissions, openAppSettings, checkPermissionStatus } from '../utils/permission';
import { styles, SHAPE } from './MainScreen.styles';

const MainScreen = () => {
  const devices = useCameraDevices();
  const device =
    devices.find(d => d.position === 'back' && d.physicalDevices.includes('ultra-wide-angle-camera')) ||
    devices.find(d => d.position === 'back');

  const cameraFormat = useCameraFormat(device, [
    { videoAspectRatio: 16 / 9 },
    { photoResolution: 'max' },
    { videoResolution: 'max' },
  ]);

  const cameraRef = useRef<Camera>(null);
  const { frameProcessor } = useCameraEngine(cameraRef);
  const { isTracking, setIsTracking, currentLocation } = usePotholeStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);

  useLocationTracker();

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isTracking ? 1 : 0,
      useNativeDriver: false,
      speed: 1,
    }).start();
  }, [isTracking]);

  const animatedSize = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [SHAPE.circle.size, SHAPE.square.size],
  });
  const animatedRadius = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [SHAPE.circle.radius, SHAPE.square.radius],
  });

  useEffect(() => {
    Orientation.lockToPortrait();

    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        setHasPermission(await checkPermissionStatus());
      }
      appState.current = next;
    });

    (async () => setHasPermission(await requestHardwarePermissions()))();

    return () => {
      Orientation.unlockAllOrientations();
      sub.remove();
    };
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4d79ff" />
        <Text style={styles.loadingText}>시스템 권한 확인 중...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>🚫</Text>
        <Text style={styles.errorText}>권한이 필요합니다</Text>
        <Text style={styles.subText}>
          정확한 포트홀 위치 기록을 위해{"\n"}카메라와 위치 권한이 필수입니다.
        </Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
          <Text style={styles.buttonText}>설정에서 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.cameraWrapper}>
        {device && (
          <Camera
            ref={cameraRef}
            style={{ flex: 1 }}
            device={device}
            isActive={true}
            photo={true}
            frameProcessor={isTracking ? frameProcessor : undefined}
            pixelFormat="yuv"
            videoStabilizationMode="off"
            enableLocation={true}
            format={cameraFormat}
            zoom={device.minZoom}
            enableZoomGesture={true}
          />
        )}
      </View>

      <View style={styles.debugOverlay}>
        <Text style={styles.debugTitle}>GWANGJU AI CONTROL</Text>
        <View style={styles.divider} />
        <Text style={styles.debugLabel}>
          LAT: <Text style={styles.debugValue}>{currentLocation?.lat?.toFixed(6) || '0.000000'}</Text>
        </Text>
        <Text style={styles.debugLabel}>
          LNG: <Text style={styles.debugValue}>{currentLocation?.lng?.toFixed(6) || '0.000000'}</Text>
        </Text>
        <Text style={[styles.statusText, { color: isTracking ? '#00ff00' : '#ffcc00' }]}>
          STATUS: {isTracking ? 'RUNNING' : 'IDLE'}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.mainButton}
        onPress={() => setIsTracking(!isTracking)}
      >
        <Animated.View
          style={[
            styles.innerShape,
            {
              width:        animatedSize,
              height:       animatedSize,
              borderRadius: animatedRadius,
            },
          ]}
        />
      </TouchableOpacity>

    </View>
  );
};

export default MainScreen;