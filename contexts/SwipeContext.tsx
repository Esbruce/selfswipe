import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VariationType = 'hairstyle' | 'outfit';

export interface SwipeImage {
  id: string;
  uri: string;
  variationType: VariationType;
  isLiked: boolean;
  generatedAt: Date;
}

export interface SwipeSession {
  id: string;
  originalImageUri: string;
  variationType: VariationType;
  images: SwipeImage[];
  currentIndex: number;
  likedImages: SwipeImage[];
  isGenerating: boolean;
  createdAt: Date;
}

interface SwipeState {
  currentSession: SwipeSession | null;
  sessions: SwipeSession[];
  isLoading: boolean;
  error: string | null;
}

type SwipeAction =
  | { type: 'START_SESSION'; payload: { originalImageUri: string; variationType: VariationType } }
  | { type: 'SET_IMAGES'; payload: SwipeImage[] }
  | { type: 'SWIPE_LEFT' }
  | { type: 'SWIPE_RIGHT' }
  | { type: 'SET_GENERATING'; payload: boolean }
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
        variationType: action.payload.variationType,
        images: [],
        currentIndex: 0,
        likedImages: [],
        isGenerating: true,
        createdAt: new Date(),
      };
      return {
        ...state,
        currentSession: newSession,
        isLoading: true,
        error: null,
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
  startSession: (originalImageUri: string, variationType: VariationType) => void;
  setImages: (images: SwipeImage[]) => void;
  swipeLeft: () => void;
  swipeRight: () => void;
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
  loadSessions: () => Promise<void>;
  saveSession: () => Promise<void>;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

export function SwipeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(swipeReducer, initialState);

  const startSession = (originalImageUri: string, variationType: VariationType) => {
    dispatch({ type: 'START_SESSION', payload: { originalImageUri, variationType } });
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
        setImages,
        swipeLeft,
        swipeRight,
        setGenerating,
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
