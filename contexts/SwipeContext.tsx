import { GeminiService, GenerationProgress } from '@/services/geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

export type VariationType = 'hairstyle' | 'outfit';

export interface SwipeImage {
  id: string;
  uri: string;
  isLiked: boolean;
  generatedAt: Date;
}

export interface SwipeSession {
  id: string;
  originalImageUri: string;
  uploadedImageUrl?: string;
  variationType?: VariationType;
  images: SwipeImage[];
  currentIndex: number;
  likedImages: SwipeImage[];
  isGenerating: boolean;
  generationProgress: GenerationProgress | null;
  imageAnalysis: any | null;
  prompts: string[];
  createdAt: Date;
}

interface SwipeState {
  currentSession: SwipeSession | null;
  sessions: SwipeSession[];
  isLoading: boolean;
  error: string | null;
}

type SwipeAction =
  | { type: 'START_SESSION'; payload: { originalImageUri: string; uploadedImageUrl?: string } }
  | { type: 'SET_ANALYSIS'; payload: { analysis: any; prompts: string[] } }
  | { type: 'ADD_IMAGE'; payload: SwipeImage }
  | { type: 'SET_IMAGES'; payload: SwipeImage[] }
  | { type: 'SWIPE_LEFT' }
  | { type: 'SWIPE_RIGHT' }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: GenerationProgress | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_SESSIONS'; payload: SwipeSession[] }
  | { type: 'CLEAR_SESSION' };

const initialState: SwipeState = {
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
};

function swipeReducer(state: SwipeState, action: SwipeAction): SwipeState {
  switch (action.type) {
    case 'START_SESSION':
      const newSession: SwipeSession = {
        id: Date.now().toString(),
        originalImageUri: action.payload.originalImageUri,
        uploadedImageUrl: action.payload.uploadedImageUrl,
        images: [],
        currentIndex: 0,
        likedImages: [],
        isGenerating: true,
        generationProgress: null,
        imageAnalysis: null,
        prompts: [],
        createdAt: new Date(),
      };
      return {
        ...state,
        currentSession: newSession,
        isLoading: true,
        error: null,
      };

    case 'SET_ANALYSIS':
      console.log('🔄 SET_ANALYSIS reducer called');
      console.log('Current session exists:', !!state.currentSession);
      console.log('Analysis payload:', action.payload.analysis ? 'exists' : 'null');
      console.log('Prompts payload count:', action.payload.prompts?.length || 0);
      
      if (!state.currentSession) {
        console.log('❌ No current session in SET_ANALYSIS');
        return state;
      }
      
      const updatedSession = {
        ...state.currentSession,
        imageAnalysis: action.payload.analysis,
        prompts: action.payload.prompts,
      };
      
      console.log('✅ Updated session prompts count:', updatedSession.prompts.length);
      
      return {
        ...state,
        currentSession: updatedSession,
      };

    case 'ADD_IMAGE':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          images: [...state.currentSession.images, action.payload],
        },
      };

    case 'SET_IMAGES':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          images: action.payload,
          isGenerating: false,
        },
        isLoading: false,
      };

    case 'SWIPE_LEFT':
      if (!state.currentSession) return state;
      const currentImage = state.currentSession.images[state.currentSession.currentIndex];
      if (currentImage) {
        currentImage.isLiked = false;
      }
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          currentIndex: state.currentSession.currentIndex + 1,
        },
      };

    case 'SWIPE_RIGHT':
      if (!state.currentSession) return state;
      const likedImage = state.currentSession.images[state.currentSession.currentIndex];
      if (likedImage) {
        likedImage.isLiked = true;
        const updatedLikedImages = [...state.currentSession.likedImages, likedImage];
        return {
          ...state,
          currentSession: {
            ...state.currentSession,
            currentIndex: state.currentSession.currentIndex + 1,
            likedImages: updatedLikedImages,
          },
        };
      }
      return state;

    case 'SET_GENERATING':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          isGenerating: action.payload,
        },
        isLoading: action.payload,
      };

    case 'SET_PROGRESS':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          generationProgress: action.payload,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'LOAD_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
      };

    case 'CLEAR_SESSION':
      return {
        ...state,
        currentSession: null,
        error: null,
      };

    default:
      return state;
  }
}

interface SwipeContextType {
  state: SwipeState;
  startSession: (originalImageUri: string, uploadedImageUrl?: string) => void;
  initializeGeneration: (imageUri: string, variationType: VariationType) => Promise<void>;
  generateNextImage: () => Promise<void>;
  generateMoreImages: () => Promise<void>;
  addImage: (image: SwipeImage) => void;
  setImages: (images: SwipeImage[]) => void;
  swipeLeft: () => void;
  swipeRight: () => void;
  setGenerating: (isGenerating: boolean) => void;
  setProgress: (progress: GenerationProgress | null) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
  loadSessions: () => Promise<void>;
  saveSession: () => Promise<void>;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

export function SwipeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(swipeReducer, initialState);

  const startSession = (originalImageUri: string, uploadedImageUrl?: string) => {
    dispatch({ type: 'START_SESSION', payload: { originalImageUri, uploadedImageUrl } });
  };

  const initializeGeneration = async (imageUri: string, variationType: VariationType) => {
    if (!state.currentSession || state.isGenerating) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      const geminiService = new GeminiService();
      
      // Analyze the uploaded image
      setProgress({
        step: 'analyzing',
        progress: 10,
        message: 'Analyzing your image...'
      });
      
      const imageAnalysis = await geminiService.analyzeImage(imageUri);
      console.log('Image analysis completed:', imageAnalysis);
      
      // Generate prompts
      setProgress({
        step: 'prompting',
        progress: 30,
        message: 'Creating personalized prompts...'
      });
      
      const prompts = await geminiService.generatePrompts(imageAnalysis, variationType, 10);
      console.log('Generated prompts:', prompts.length);
      
      // Store analysis and prompts
      console.log('💾 Storing analysis and prompts in session...');
      console.log('Analysis keys:', Object.keys(imageAnalysis));
      console.log('Prompts count:', prompts.length);
      dispatch({ type: 'SET_ANALYSIS', payload: { analysis: imageAnalysis, prompts } });
      
      // Generate first 2 images
      setProgress({
        step: 'generating',
        progress: 50,
        message: 'Generating your first variations...'
      });
      
      console.log('🎯 About to generate first 2 images...');
      await generateNextImageWithPrompts(prompts, 0);
      console.log('🎯 First image generated, generating second...');
      
      setProgress({
        step: 'generating',
        progress: 75,
        message: 'Generating second variation...'
      });
      
      await generateNextImageWithPrompts(prompts, 1);
      console.log('🎯 Second image generated');
      
      setGenerating(false);
      setProgress(null);
    } catch (error) {
      console.error('Error in initializeGeneration:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize generation');
      setGenerating(false);
      setProgress(null);
    }
  };

  const generateNextImageWithPrompts = async (prompts: string[], promptIndex: number) => {
    console.log(`🚀 Generating image ${promptIndex + 1} with prompt...`);
    console.log('Prompt:', prompts[promptIndex]?.substring(0, 100) + '...');
    
    if (!state.currentSession) {
      console.log('❌ No current session');
      return;
    }
    
    if (promptIndex >= prompts.length) {
      console.log('❌ Prompt index out of range');
      return;
    }
    
    // Set generating state for individual image generation
    setGenerating(true);
    
    try {
      const geminiService = new GeminiService();
      const currentIndex = state.currentSession.images.length;
      const prompt = prompts[promptIndex];
      
      console.log(`📊 Current state: ${currentIndex} images generated, ${prompts.length} total prompts`);
      console.log(`📝 Using prompt ${promptIndex + 1}: ${prompt?.substring(0, 100)}...`);
      
      if (!prompt) {
        console.log('❌ No prompt available for current index');
        return;
      }
      
      setProgress({
        step: 'generating',
        progress: 50 + (currentIndex * 2.5), // 50% base + 2.5% per image
        message: `Generating image ${currentIndex + 1}...`
      });
      
      console.log('🎨 Calling geminiService.generateImages...');
      const generatedImages = await geminiService.generateImages(
        state.currentSession.originalImageUri,
        [prompt],
        state.currentSession.variationType,
        (progress) => {
          console.log(`📈 Progress update: ${progress.message} (${progress.progress}%)`);
          setProgress(progress);
        }
      );
      
      console.log(`🎉 Generated ${generatedImages.length} images`);
      
      if (generatedImages.length > 0) {
        const swipeImage: SwipeImage = {
          id: generatedImages[0].id,
          uri: generatedImages[0].uri,
          variationType: generatedImages[0].variationType,
          isLiked: false,
          generatedAt: new Date(),
        };
        
        console.log('💾 Adding image to session:', swipeImage.id);
        dispatch({ type: 'ADD_IMAGE', payload: swipeImage });
      } else {
        console.warn('⚠️ No images were generated');
      }
    } catch (error) {
      console.error('❌ Error generating next image:', error);
      console.error('Error details:', error);
      // Don't set error state for individual image failures, just log
    } finally {
      setGenerating(false);
    }
  };

  const generateNextImage = async () => {
    console.log('🔍 Checking session state...');
    console.log('Current session:', state.currentSession ? 'exists' : 'null');
    console.log('Prompts length:', state.currentSession?.prompts?.length || 0);
    console.log('Images length:', state.currentSession?.images?.length || 0);
    
    if (!state.currentSession || !state.currentSession.prompts.length) {
      console.log('❌ Cannot generate next image: no session or prompts');
      console.log('Session exists:', !!state.currentSession);
      console.log('Prompts available:', state.currentSession?.prompts?.length || 0);
      return;
    }
    
    try {
      console.log('🚀 Starting generateNextImage...');
      const geminiService = new GeminiService();
      const currentIndex = state.currentSession.images.length;
      const prompt = state.currentSession.prompts[currentIndex];
      
      console.log(`📊 Current state: ${currentIndex} images generated, ${state.currentSession.prompts.length} total prompts`);
      console.log(`📝 Using prompt ${currentIndex + 1}: ${prompt?.substring(0, 100)}...`);
      
      if (!prompt) {
        console.log('❌ No prompt available for current index');
        return;
      }
      
      setProgress({
        step: 'generating',
        progress: 50 + (currentIndex * 2.5), // 50% base + 2.5% per image
        message: `Generating image ${currentIndex + 1}...`
      });
      
      console.log('🎨 Calling geminiService.generateImages...');
      const generatedImages = await geminiService.generateImages(
        state.currentSession.originalImageUri,
        [prompt],
        state.currentSession.variationType,
        (progress) => {
          console.log(`📈 Progress update: ${progress.message} (${progress.progress}%)`);
          setProgress(progress);
        }
      );
      
      console.log(`🎉 Generated ${generatedImages.length} images`);
      
      if (generatedImages.length > 0) {
        const swipeImage: SwipeImage = {
          id: generatedImages[0].id,
          uri: generatedImages[0].uri,
          variationType: generatedImages[0].variationType,
          isLiked: false,
          generatedAt: new Date(),
        };
        
        console.log('💾 Adding image to session:', swipeImage.id);
        dispatch({ type: 'ADD_IMAGE', payload: swipeImage });
      } else {
        console.warn('⚠️ No images were generated');
      }
    } catch (error) {
      console.error('❌ Error generating next image:', error);
      console.error('Error details:', error);
      // Don't set error state for individual image failures, just log
    }
  };

  const generateMoreImages = async () => {
    if (!state.currentSession || state.currentSession.likedImages.length === 0) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      const geminiService = new GeminiService();
      
      // Analyze liked images to understand preferences
      setProgress({
        step: 'analyzing',
        progress: 10,
        message: 'Analyzing your preferences...'
      });
      
      // For now, we'll use the original image for analysis
      // In a more advanced implementation, you could analyze the liked images
      const imageAnalysis = await geminiService.analyzeImage(state.currentSession.originalImageUri);
      
      // Generate more prompts based on preferences
      setProgress({
        step: 'prompting',
        progress: 30,
        message: 'Creating new variations...'
      });
      
      const prompts = await geminiService.generatePrompts(imageAnalysis, state.currentSession.variationType, 5);
      
      // Generate images
      const generatedImages = await geminiService.generateImages(
        state.currentSession.originalImageUri,
        prompts,
        state.currentSession.variationType,
        (progress) => {
          setProgress(progress);
        }
      );
      
      // Convert to SwipeImage format and add to existing images
      const newSwipeImages: SwipeImage[] = generatedImages.map((img, index) => ({
        id: img.id,
        uri: img.uri,
        variationType: img.variationType,
        isLiked: false,
        generatedAt: new Date(),
      }));
      
      const allImages = [...state.currentSession.images, ...newSwipeImages];
      setImages(allImages);
      setGenerating(false);
      setProgress(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate more images');
      setGenerating(false);
      setProgress(null);
    }
  };

  const addImage = (image: SwipeImage) => {
    dispatch({ type: 'ADD_IMAGE', payload: image });
  };

  const setImages = (images: SwipeImage[]) => {
    dispatch({ type: 'SET_IMAGES', payload: images });
  };

  const swipeLeft = () => {
    dispatch({ type: 'SWIPE_LEFT' });
  };

  const swipeRight = () => {
    dispatch({ type: 'SWIPE_RIGHT' });
  };

  const setGenerating = (isGenerating: boolean) => {
    dispatch({ type: 'SET_GENERATING', payload: isGenerating });
  };

  const setProgress = (progress: GenerationProgress | null) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearSession = () => {
    dispatch({ type: 'CLEAR_SESSION' });
  };

  const loadSessions = async () => {
    try {
      const sessionsJson = await AsyncStorage.getItem('swipe_sessions');
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        dispatch({ type: 'LOAD_SESSIONS', payload: sessions });
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const saveSession = async () => {
    if (!state.currentSession) return;
    
    try {
      const updatedSessions = [...state.sessions, state.currentSession];
      await AsyncStorage.setItem('swipe_sessions', JSON.stringify(updatedSessions));
      dispatch({ type: 'LOAD_SESSIONS', payload: updatedSessions });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  return (
    <SwipeContext.Provider
      value={{
        state,
        startSession,
        initializeGeneration,
        generateNextImage,
        generateMoreImages,
        addImage,
        setImages,
        swipeLeft,
        swipeRight,
        setGenerating,
        setProgress,
        setError,
        clearSession,
        loadSessions,
        saveSession,
      }}
    >
      {children}
    </SwipeContext.Provider>
  );
}

export function useSwipe() {
  const context = useContext(SwipeContext);
  if (context === undefined) {
    throw new Error('useSwipe must be used within a SwipeProvider');
  }
  return context;
}
