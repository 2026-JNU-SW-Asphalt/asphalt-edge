import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export const CAMERA_W = SCREEN_W;
export const CAMERA_H = SCREEN_W * (16 / 9);

export const BUTTON_SIZE = 72;
export const BUTTON_HALF = BUTTON_SIZE / 2;

export const BUTTON_POS = {
  bottom: 50,
  left: SCREEN_W / 2 - BUTTON_HALF,
};

export const SHAPE = {
  circle: { size: 26, radius: 13 },
  square: { size: 46, radius: 8  },
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { width: CAMERA_W, height: CAMERA_H },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 20 },
  errorIcon: { fontSize: 50, marginBottom: 20 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subText: { color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  loadingText: { color: '#fff', marginTop: 15 },
  settingsButton: { backgroundColor: '#4d79ff', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  debugOverlay: {
    position: 'absolute', top: 60, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', padding: 15,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  debugTitle: { color: '#4d79ff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 8 },
  debugLabel: { color: '#fff', fontSize: 13, marginBottom: 4 },
  debugValue: { color: '#00ffff', fontWeight: '500' },
  statusText: { fontSize: 15, fontWeight: 'bold', marginTop: 5 },
  mainButton: {
    position: 'absolute',
    bottom: BUTTON_POS.bottom,
    left: BUTTON_POS.left,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_HALF,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  innerShape: {
    backgroundColor: '#e0000f',
  },
});