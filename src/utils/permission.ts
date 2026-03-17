import { PermissionsAndroid, Platform, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';

/**
 * @function openAppSettings
 * @description 시스템 설정 화면으로 이동
 */
export const openAppSettings = async () => {
  await Linking.openSettings();
};

/**
 * @function requestHardwarePermissions
 * @description 카메라, 위치, 저장 권한 확인 및 요청
 * @returns {Promise<boolean>} 최종 권한 승인 여부
 */
export const requestHardwarePermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // 1. GPS 권한 요청
    const locationStatus = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

    // 2. 카메라 권한 요청
    const cameraPermission = await Camera.requestCameraPermission();

    // 3. 저장소 권한 요청 (Android 10 이하 버전용)
    // 최신 버전은 저장 시 권한이 필요 없는 경우가 많으나, 호환성을 위해 체크
    let storageStatus = PermissionsAndroid.RESULTS.GRANTED;
    if (Platform.Version < 33) {
      storageStatus = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    }

    return (
      locationStatus === PermissionsAndroid.RESULTS.GRANTED &&
      cameraPermission === 'granted' &&
      storageStatus === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
};

/**
 * @function checkPermissionStatus
 * @description 단순 권한 상태만 확인 (다이얼로그 미발생)
 */
export const checkPermissionStatus = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const hasLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    const cameraPermission = Camera.getCameraPermissionStatus();

    let hasStorage = true;
    if (Platform.Version < 33) {
      hasStorage = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    }

    return hasLocation && cameraPermission === 'granted' && hasStorage;
  }
  return true;
};
