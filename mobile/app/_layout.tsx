import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import Ionicons from '@expo/vector-icons/Ionicons'
import { View, ActivityIndicator } from 'react-native'
import { AuthProvider } from '../context/AuthContext'

export default function RootLayout() {
  // Pre-load Ionicons font so icons render immediately and avoid
  // the asset-fetch race that produces "Unable to download asset" errors.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  })

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f4ff',
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="document/new"
          options={{ title: 'New Document', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="document/[id]"
          options={{ title: 'Document', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="document/edit/[id]"
          options={{ title: 'Edit Document', headerBackTitle: 'Back' }}
        />
      </Stack>
    </AuthProvider>
  )
}
