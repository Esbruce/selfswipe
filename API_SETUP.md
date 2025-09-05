# API Key Setup Guide

## How to Add Your Gemini API Key

### Option 1: Update app.json (Recommended for Expo)

1. Open `app.json` in your project root
2. Find the `extra` section:
   ```json
   "extra": {
     "GEMINI_API_KEY": "your_gemini_api_key_here"
   }
   ```
3. Replace `"your_gemini_api_key_here"` with your actual Gemini API key:
   ```json
   "extra": {
     "GEMINI_API_KEY": "AIzaSyC..."
   }
   ```

### Option 2: Environment Variables (Alternative)

If you prefer using environment variables:

1. Create a `.env` file in your project root
2. Add your API key:
   ```
   GEMINI_API_KEY=AIzaSyC...
   ```

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key
5. Copy the key and add it to your configuration

## Testing

After adding your API key, restart the Expo development server:

```bash
npm start
```

The app should now work without the "GEMINI_API_KEY not found" error.

## Security Note

- Never commit your actual API key to version control
- The `app.json` approach is fine for development
- For production, consider using Expo's environment variable system
