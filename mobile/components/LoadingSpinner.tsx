import { View, ActivityIndicator, StyleSheet } from 'react-native'

type LoadingSpinnerProps = {
  color?: string
  size?: 'small' | 'large'
}

export default function LoadingSpinner({
  color = '#6366f1',
  size = 'large',
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
  },
})
