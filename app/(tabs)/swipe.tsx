import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import SwipeCard from '@/components/SwipeCard';
import { useSwipe } from '@/contexts/SwipeContext';
import { SwipeImage } from '@/contexts/SwipeContext';

export default function SwipeScreen() {
  const router = useRouter();
  const { state, swipeLeft, swipeRight, setImages, setGenerating, setError, clearSession } = useSwipe();
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data for now - will be replaced with actual image generation
  const generateMockImages = (variationType: 'hairstyle' | 'outfit'): SwipeImage[] => {
    const mockImages: SwipeImage[] = [];
    for (let i = 0; i < 20; i++) {
      mockImages.push({
        id: `mock-${i}`,
        uri: `https://picsum.photos/400/600?random=${i}`,
        variationType,
        isLiked: false,
        generatedAt: new Date(),
      });
    }
    return mockImages;
  };

  useEffect(() => {
    if (state.currentSession && state.currentSession.images.length === 0 && !state.isGenerating) {
      // Start generating images
      setIsGenerating(true);
      setGenerating(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const mockImages = generateMockImages(state.currentSession!.variationType);
        setImages(mockImages);
        setIsGenerating(false);
        setGenerating(false);
      }, 2000);
    }
  }, [state.currentSession, setImages, setGenerating]);

  const handleSwipeLeft = () => {
    swipeLeft();
    checkIfFinished();
  };

  const handleSwipeRight = () => {
    swipeRight();
    checkIfFinished();
  };

  const checkIfFinished = () => {
    if (state.currentSession && state.currentSession.currentIndex >= state.currentSession.images.length - 1) {
      // All images have been swiped through
      Alert.alert(
        'All Done!',
        `You've swiped through all ${state.currentSession.images.length} images. You liked ${state.currentSession.likedImages.length} of them.`,
        [
          {
            text: 'Generate More',
            onPress: () => {
              // TODO: Generate more images based on liked ones
              Alert.alert('Coming Soon', 'This feature will generate 10 more images based on your preferences!');
            },
          },
          {
            text: 'Start Over',
            onPress: () => {
              clearSession();
              router.push('/');
            },
          },
        ]
      );
    }
  };

  const handleBackToUpload = () => {
    Alert.alert(
      'Start Over?',
      'Are you sure you want to go back to upload a new image? This will clear your current session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Over',
          onPress: () => {
            clearSession();
            router.push('/');
          },
        },
      ]
    );
  };

  if (!state.currentSession) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          No Active Session
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Please upload an image first to start swiping
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
          <ThemedText style={styles.buttonText}>Upload Image</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (isGenerating || state.isGenerating) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText type="subtitle" style={styles.generatingText}>
          Generating your variations...
        </ThemedText>
        <ThemedText style={styles.generatingSubtext}>
          This may take a few moments
        </ThemedText>
      </ThemedView>
    );
  }

  if (state.error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.errorTitle}>
          Something went wrong
        </ThemedText>
        <ThemedText style={styles.errorText}>
          {state.error}
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={() => setError(null)}>
          <ThemedText style={styles.buttonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const currentIndex = state.currentSession.currentIndex;
  const images = state.currentSession.images;
  const remainingImages = images.length - currentIndex;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToUpload}>
          <ThemedText style={styles.backButton}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.progressText}>
          {remainingImages} remaining
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {images.slice(currentIndex, currentIndex + 3).map((image, index) => (
          <SwipeCard
            key={image.id}
            imageUri={image.uri}
            index={index}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            isTop={index === 0}
          />
        ))}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <ThemedText style={styles.statsText}>
          Liked: {state.currentSession.likedImages.length} | 
          Remaining: {remainingImages}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  generatingText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  generatingSubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#ff4757',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
