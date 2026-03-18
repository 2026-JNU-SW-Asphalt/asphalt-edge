import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

export const BUTTON_SIZE = 72;
const BUTTON_HALF = BUTTON_SIZE / 2;

export const SHAPE = {
  buttonSize: BUTTON_SIZE,
  circle: { size: 26, radius: 13 },
  square: { size: 46, radius: 8 },
};

export const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 50,
    left: SCREEN_W / 2 - BUTTON_HALF,
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
  buttonDisabled: {
    backgroundColor: '#d0d0d0',
    borderColor: '#b0b0b0',
  },
  inner: {
    backgroundColor: '#e0000f',
  },
  innerDisabled: {
    backgroundColor: '#888',
  },
});
