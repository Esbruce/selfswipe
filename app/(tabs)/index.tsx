import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ImageUpload, { VariationType } from '@/components/ImageUpload';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSwipe } from '@/contexts/SwipeContext';

export default function HomeScreen() {
  const { startSession } = useSwipe();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  const handleImageSelected = async (uri: string, variationType: VariationType) => {
    setIsLoading(true);
    
    // Start a new session
    startSession(uri, variationType);
    
    // Navigate to swipe screen
    router.push('/swipe');
    
    setIsLoading(false);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Welcome to SelfSwipe</ThemedText>
        <ThemedText>
          Upload an image to start swiping and discover your style preferences.
        </ThemedText>
        <ImageUpload 
          onImageSelected={handleImageSelected}
          isLoading={isLoading}
        />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to access protected content that requires authentication.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Sign In</ThemedText>
        <ThemedText>
          To access the Explore page, you'll need to sign in first.
        </ThemedText>
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  signInButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  signInButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
