import SwipeCard from '@/components/SwipeCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSwipe } from '@/contexts/SwipeContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SwipeScreen() {
  const router = useRouter();
  const { 
    state, 
    swipeLeft, 
    swipeRight, 
    initializeGeneration,
    generateNextImage,
    generateMoreImages,
    setError, 
    clearSession 
  } = useSwipe();

  useEffect(() => {
    if (state.currentSession && state.currentSession.images.length === 0 && !state.isGenerating) {
      // Start generating images using real Gemini API
      initializeGeneration(state.currentSession.originalImageUri, state.currentSession.variationType);
    }
  }, [state.currentSession?.id, state.currentSession?.images.length, state.isGenerating]);

  // Generate next image when user is close to the end
  useEffect(() => {
    if (state.currentSession && state.currentSession.images.length > 0) {
      const currentIndex = state.currentSession.currentIndex;
      const totalImages = state.currentSession.images.length;
      const remainingImages = totalImages - currentIndex;
      
      // Generate next image when only 2 images remain
      if (remainingImages <= 2 && currentIndex < state.currentSession.prompts.length - 1) {
        generateNextImage();
      }
    }
  }, [state.currentSession?.currentIndex, state.currentSession?.images.length]);

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
      // Check if we've generated all 20 images
      if (state.currentSession.images.length >= 20) {
        // All images have been swiped through
        Alert.alert(
          'All Done!',
          `You've swiped through all ${state.currentSession.images.length} images. You liked ${state.currentSession.likedImages.length} of them.`,
          [
            {
              text: 'Generate More',
              onPress: async () => {
                try {
                  await generateMoreImages();
                } catch (error) {
                  Alert.alert('Error', 'Failed to generate more images. Please try again.');
                }
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
      // If we haven't generated all 20 yet, just wait for more images to be generated
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

  if (state.isGenerating) {
    const progress = state.currentSession?.generationProgress;
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText type="subtitle" style={styles.generatingText}>
          {progress?.message || 'Generating your variations...'}
        </ThemedText>
        {progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress.progress}%` }
                ]} 
              />
            </View>
            <ThemedText style={styles.progressText}>
              {progress.progress}%
            </ThemedText>
          </View>
        )}
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
  const isWaitingForNextImage = remainingImages <= 2 && currentIndex < state.currentSession.prompts.length - 1;

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
        {isWaitingForNextImage && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={styles.loadingText}>
              Generating next image...
            </ThemedText>
          </View>
        )}
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
  progressContainer: {
    width: '80%',
    marginVertical: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
