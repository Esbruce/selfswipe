import Constants from 'expo-constants';

export const API_CONFIG = {
  GEMINI_API_KEY: Constants.expoConfig?.extra?.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
};

export const validateApiKeys = () => {
  if (!API_CONFIG.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found. Please add it to app.json extra section or environment variables.');
  }
  return true;
};
