import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import ImageUpload, { VariationType } from '@/components/ImageUpload';
import { useSwipe } from '@/contexts/SwipeContext';

export default function HomeScreen() {
  const router = useRouter();
  const { startSession } = useSwipe();
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelected = async (uri: string, variationType: VariationType) => {
    setIsLoading(true);
    
    // Start a new session
    startSession(uri, variationType);
    
    // Navigate to swipe screen
    router.push('/swipe');
    
    setIsLoading(false);
  };

  return (
    <ImageUpload 
      onImageSelected={handleImageSelected}
      isLoading={isLoading}
    />
  );
}

