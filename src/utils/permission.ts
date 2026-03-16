import { PermissionsAndroid, Platform, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';

/**
 * @function openAppSettings
 * @description 시스템 설정 화면으로 이동 (사용자 명시적 클릭 시 호출)
 */
export const openAppSettings = async () => {
  await Linking.openSettings();
};

/**
 * @function requestHardwarePermissions
 * @description 권한 확인 및 요청 로직 (UI 간섭 제거)
 * @returns {Promise<boolean>} 최종 권한 승인 여부
 */
export const requestHardwarePermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // 1. GPS 권한 요청
    const locationStatus = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    // 2. 카메라 권한 요청
    const cameraPermission = await Camera.requestCameraPermission();

    return (
      locationStatus === PermissionsAndroid.RESULTS.GRANTED &&
      cameraPermission === 'granted'
    );
  }
  return true;
};

/**
 * @function checkPermissionStatus
 * @description 단순 권한 상태만 확인 (다이얼로그를 띄우지 않음)
 */
export const checkPermissionStatus = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const hasLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    const cameraPermission = Camera.getCameraPermissionStatus();
    return hasLocation && cameraPermission === 'granted';
  }
  return true;
};