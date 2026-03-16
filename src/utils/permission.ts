import { PermissionsAndroid, Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';

/**
 * @function requestHardwarePermissions
 * @description 카메라 및 GPS 접근 권한을 요청합니다.
 * @returns {Promise<boolean>} 모든 권한 승인 여부
 */
export const requestHardwarePermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // 1. GPS 권한 요청 (정밀 위치)
    const locationGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    // 2. 카메라 권한 요청
    const cameraPermission = await Camera.requestCameraPermission();

    return (
      locationGranted === PermissionsAndroid.RESULTS.GRANTED &&
      cameraPermission === 'granted'
    );
  }
  return true;
};