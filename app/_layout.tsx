import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SwipeProvider } from '@/contexts/SwipeContext';
import { useColorScheme } from '@/hooks/useColorScheme';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { state } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!state.isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in auth group, redirect to login
      router.replace('/(auth)/login');
    } else if (state.isAuthenticated && inAuthGroup) {
      // User is authenticated but in auth group, redirect to main app
      router.replace('/(tabs)');
    }
  }, [state.isAuthenticated, state.isLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SwipeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SwipeProvider>
    </GestureHandlerRootView>
  );
}
