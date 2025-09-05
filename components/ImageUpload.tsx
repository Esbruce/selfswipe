import { useAuth } from '@/contexts/AuthContext';
import { testAuthentication } from '@/lib/authTest';
import { uploadFileToSupabase, UploadResult } from '@/lib/fileUpload';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ImageUploadProps {
  onImageUploaded: (uri: string, uploadedUrl: string) => void;
  isLoading?: boolean;
}

export default function ImageUpload({ onImageUploaded, isLoading = false }: ImageUploadProps) {
  const { state: authState } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<{ mimeType?: string; fileName?: string; fileSize?: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
      const asset = result.assets[0] as any;
      const guessedFromExt = (() => {
        const ext = (asset.fileName?.split('.').pop() || '').toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
        if (ext === 'png') return 'image/png';
        if (ext === 'webp') return 'image/webp';
        if (ext === 'gif') return 'image/gif';
        if (ext === 'heic' || ext === 'heif') return 'image/heic';
        return undefined;
      })();
      const mimeType = asset.mimeType || (asset.type && asset.type.includes('/') ? asset.type : guessedFromExt);
      setSelectedImage(asset.uri);
      setSelectedMeta({ mimeType, fileName: asset.fileName, fileSize: asset.fileSize });
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
      const asset = result.assets[0] as any;
      const guessedFromExt = (() => {
        const ext = (asset.fileName?.split('.').pop() || '').toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
        if (ext === 'png') return 'image/png';
        if (ext === 'webp') return 'image/webp';
        if (ext === 'gif') return 'image/gif';
        if (ext === 'heic' || ext === 'heif') return 'image/heic';
        return undefined;
      })();
      const mimeType = asset.mimeType || (asset.type && asset.type.includes('/') ? asset.type : guessedFromExt);
      setSelectedImage(asset.uri);
      setSelectedMeta({ mimeType, fileName: asset.fileName, fileSize: asset.fileSize });
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    if (!authState.isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to upload images to the cloud.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Optional: quick auth sanity check (can be removed once stable)
    try {
      const authTest = await testAuthentication();
      if (!authTest.success) {
        Alert.alert(
          'Authentication Error',
          `Authentication test failed: ${authTest.error}`,
          [{ text: 'OK' }]
        );
        return;
      }
    } catch {}

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    let progressInterval: ReturnType<typeof setInterval> | null = null;
    try {
      // Validate file size before uploading
      try {
        let fileSize = selectedMeta?.fileSize || 0;
        if (!fileSize) {
          const info = await FileSystem.getInfoAsync(selectedImage, { size: true });
          fileSize = (info.size as number) || 0;
        }
        if (fileSize > MAX_FILE_SIZE) {
          setUploadError('File too large. Please choose an image smaller than 5MB.');
          Alert.alert('File Too Large', 'Please choose an image smaller than 5MB.', [{ text: 'OK' }]);
          return;
        }
      } catch {}

      // Simulate progress for better UX
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result: UploadResult = await uploadFileToSupabase(selectedImage, {
        userId: authState.user!.id,
        folder: 'upload',
        upsert: false,
        fileName: selectedMeta?.fileName,
        sourceMimeType: selectedMeta?.mimeType,
      });

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        setUploadedUrl(result.url);
        onImageUploaded(selectedImage, result.url);
      } else {
        setUploadError(result.error || 'Upload failed');
        Alert.alert(
          'Upload Failed',
          result.error || 'Failed to upload image. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
      Alert.alert(
        'Upload Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const resetSelection = () => {
    setSelectedImage(null);
    setSelectedMeta(null);
    setUploadProgress(0);
    setUploadError(null);
    setUploadedUrl(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Upload Your Photo
      </ThemedText>
      
      <ThemedText style={styles.subtitle}>
        Choose a clear photo of yourself to get started
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

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <ThemedText style={styles.progressText}>
                Uploading... {uploadProgress}%
              </ThemedText>
            </View>
          )}

          {/* Upload Success */}
          {uploadedUrl && !isUploading && (
            <View style={styles.successContainer}>
              <ThemedText style={styles.successText}>✅ Upload successful!</ThemedText>
            </View>
          )}

          {/* Upload Error */}
          {uploadError && !isUploading && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>❌ {uploadError}</ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.uploadButton,
              (isLoading || isUploading) && styles.uploadButtonDisabled
            ]}
            onPress={handleUpload}
            disabled={isLoading || isUploading}
          >
            {isLoading || isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.uploadButtonText}>
                Upload to Cloud
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
    color: '#2c3e50',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
    color: '#7f8c8d',
  },
  uploadSection: {
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
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
    color: '#6c757d',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4A90E2',
  },
  imageSection: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  changeButton: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  successContainer: {
    backgroundColor: '#d4edda',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successText: {
    textAlign: 'center',
    color: '#155724',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    textAlign: 'center',
    color: '#721c24',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
