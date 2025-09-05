import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import ImageUpload from '@/components/ImageUpload';
import { ThemedView } from '@/components/ThemedView';
import { useSwipe } from '@/contexts/SwipeContext';

export default function HomeScreen() {
  const { startSession } = useSwipe();
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUploaded = async (uri: string, uploadedUrl: string) => {
    setIsLoading(true);
    
    // Start a new session with the uploaded URL
    startSession(uri, uploadedUrl);
    
    // Navigate to swipe screen
    router.push('/swipe');
    
    setIsLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ImageUpload 
        onImageUploaded={handleImageUploaded}
        isLoading={isLoading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
