import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    color: '#4d79ff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 8,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    color: '#00ffff',
    fontWeight: '500',
  },
  status: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 5,
  },
});
