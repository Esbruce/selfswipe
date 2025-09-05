import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export type VariationType = 'hairstyle' | 'outfit';

interface ImageUploadProps {
  onImageSelected: (uri: string, variationType: VariationType) => void;
  isLoading?: boolean;
}

export default function ImageUpload({ onImageSelected, isLoading = false }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [variationType, setVariationType] = useState<VariationType | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photo library to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleVariationSelect = (type: VariationType) => {
    setVariationType(type);
  };

  const handleContinue = () => {
    if (selectedImage && variationType) {
      onImageSelected(selectedImage, variationType);
    }
  };

  const resetSelection = () => {
    setSelectedImage(null);
    setVariationType(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Upload Your Photo
      </ThemedText>
      
      <ThemedText style={styles.subtitle}>
        Choose a clear photo of yourself to generate variations
      </ThemedText>

      {!selectedImage ? (
        <View style={styles.uploadSection}>
          <View style={styles.imagePlaceholder}>
            <ThemedText style={styles.placeholderText}>
              📸
            </ThemedText>
            <ThemedText style={styles.placeholderSubtext}>
              No image selected
            </ThemedText>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <ThemedText style={styles.buttonText}>Choose from Gallery</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={takePhoto}>
              <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
                Take Photo
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity style={styles.changeButton} onPress={resetSelection}>
              <ThemedText style={styles.changeButtonText}>Change</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.variationSection}>
            <ThemedText type="subtitle" style={styles.variationTitle}>
              What would you like to vary?
            </ThemedText>
            
            <View style={styles.variationButtons}>
              <TouchableOpacity
                style={[
                  styles.variationButton,
                  variationType === 'hairstyle' && styles.variationButtonSelected
                ]}
                onPress={() => handleVariationSelect('hairstyle')}
              >
                <ThemedText style={[
                  styles.variationButtonText,
                  variationType === 'hairstyle' && styles.variationButtonTextSelected
                ]}>
                  ✂️ Hairstyle
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.variationButton,
                  variationType === 'outfit' && styles.variationButtonSelected
                ]}
                onPress={() => handleVariationSelect('outfit')}
              >
                <ThemedText style={[
                  styles.variationButtonText,
                  variationType === 'outfit' && styles.variationButtonTextSelected
                ]}>
                  👕 Outfit
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              (!variationType || isLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!variationType || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.continueButtonText}>
                Generate Variations
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
  },
  uploadSection: {
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    opacity: 0.6,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  imageSection: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  changeButton: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  variationSection: {
    width: '100%',
    marginBottom: 30,
  },
  variationTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  variationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  variationButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  variationButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  variationButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  variationButtonTextSelected: {
    color: '#007AFF',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
