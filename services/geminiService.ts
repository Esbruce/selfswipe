import { API_CONFIG, validateApiKeys } from '@/config/api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface ImageAnalysis {
  gender: string;
  ageRange: string;
  hairColor: string;
  hairLength: string;
  hairStyle: string;
  faceShape: string;
  skinTone: string;
  eyeColor: string;
  bodyType: string;
  clothingStyle: string;
  overallStyle: string;
}

export interface GenerationProgress {
  step: 'analyzing' | 'prompting' | 'generating';
  progress: number;
  message: string;
}

export interface GeneratedImage {
  id: string;
  uri: string;
  variationType: 'hairstyle' | 'outfit';
  prompt: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private imageModel: any;
  private textModel: any;

  constructor() {
    validateApiKeys();
    
    this.genAI = new GoogleGenerativeAI(API_CONFIG.GEMINI_API_KEY!);
    this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.imageModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
  }

  async analyzeImage(imageUri: string): Promise<ImageAnalysis> {
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Starting image analysis (attempt ${attempt}/${maxRetries})...`);
        // Convert image to base64
        const base64Image = await this.convertImageToBase64(imageUri);
        
        const prompt = `
          Analyze this portrait photo and provide detailed information about the person. 
          Focus on features that would be important for generating consistent variations in hairstyles or outfits.
          
          Please provide the following information in a structured format:
          - Gender (male/female/other)
          - Age range (e.g., "20-30", "30-40", etc.)
          - Hair color (e.g., "blonde", "brown", "black", "red", "gray")
          - Hair length (e.g., "short", "medium", "long")
          - Current hair style (e.g., "straight", "curly", "wavy", "pixie cut", "bob", etc.)
          - Face shape (e.g., "oval", "round", "square", "heart", "diamond")
          - Skin tone (e.g., "fair", "light", "medium", "olive", "tan", "dark")
          - Eye color (e.g., "blue", "brown", "green", "hazel")
          - Body type/build (e.g., "slim", "athletic", "average", "curvy")
          - Current clothing style (e.g., "casual", "formal", "bohemian", "preppy", "edgy")
          - Overall style aesthetic (e.g., "classic", "modern", "vintage", "minimalist", "eclectic")
          
          Be specific and detailed in your analysis. This information will be used to generate consistent variations.
        `;

        const result = await this.textModel.generateContent([
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg'
            }
          },
          prompt
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Parse the response to extract structured data
        const analysis = this.parseImageAnalysis(text);
        console.log('✅ Image analysis completed successfully');
        return analysis;
      } catch (error) {
        lastError = error;
        console.error(`❌ Error analyzing image (attempt ${attempt}/${maxRetries}):`, error);
        
        // Check if it's a retryable error (503, 429, or overloaded)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('overloaded')) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Non-retryable error, throw immediately
          throw error;
        }
      }
    }
    
    // If all retries failed
    throw new Error(`Failed to analyze image after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  async generatePrompts(
    analysis: ImageAnalysis, 
    variationType: 'hairstyle' | 'outfit', 
    count: number
  ): Promise<string[]> {
    try {
      console.log(`🤖 Generating ${count} ${variationType} prompts using Gemini...`);
      
      const prompt = this.createPromptGenerationPrompt(analysis, variationType, count);
      console.log(`📝 Prompt generation prompt: ${prompt.substring(0, 200)}...`);
      
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`📄 Raw response from Gemini: ${text.substring(0, 500)}...`);
      
      const prompts = this.parsePromptsFromResponse(text, count);
      console.log(`✨ Successfully generated ${prompts.length} prompts`);
      
      return prompts;
    } catch (error) {
      console.error('Error generating prompts:', error);
      throw new Error('Failed to generate prompts');
    }
  }

  private createPromptGenerationPrompt(analysis: ImageAnalysis, variationType: 'hairstyle' | 'outfit', count: number): string {
    if (variationType === 'hairstyle') {
      return `You are a professional image editing prompt expert. Generate ${count} diverse hairstyle editing prompts that will be used with the original photo to change ONLY the hairstyle while preserving all other features.

Person Analysis:
- Gender: ${analysis.gender}
- Age Range: ${analysis.ageRange}
- Hair Color: ${analysis.hairColor}
- Hair Length: ${analysis.hairLength}
- Current Hair Style: ${analysis.hairStyle}
- Face Shape: ${analysis.faceShape}
- Skin Tone: ${analysis.skinTone}
- Eye Color: ${analysis.eyeColor}
- Overall Style: ${analysis.overallStyle}

Generate ${count} unique hairstyle editing prompts that:
1. Use the inpainting/semantic masking approach
2. Change ONLY the hair while keeping facial features, skin tone, eyes, and everything else exactly the same
3. Create diverse hairstyles (short, long, curly, straight, braided, updo, etc.)
4. Are appropriate for their age and face shape
5. Include specific styling details and texture descriptions
6. Use professional photography terminology

Format each prompt as: "Using the provided image, change only the hair to [specific hairstyle description]. Keep everything else in the image exactly the same, preserving the original facial features, skin tone, eye color, facial structure, and composition. The person's identity and appearance should remain completely unchanged except for the hairstyle."

Return ONLY the prompts, one per line, numbered 1-${count}.`;
    } else {
      return `You are a professional image editing prompt expert. Generate ${count} diverse outfit editing prompts that will be used with the original photo to change ONLY the clothing while preserving all other features.

Person Analysis:
- Gender: ${analysis.gender}
- Age Range: ${analysis.ageRange}
- Body Type: ${analysis.bodyType}
- Skin Tone: ${analysis.skinTone}
- Current Clothing Style: ${analysis.clothingStyle}
- Overall Style: ${analysis.overallStyle}

Generate ${count} unique outfit editing prompts that:
1. Use the inpainting/semantic masking approach
2. Change ONLY the clothing/outfit while keeping facial features, skin tone, hair, and everything else exactly the same
3. Create diverse outfit styles (casual, formal, bohemian, edgy, professional, etc.)
4. Are appropriate for their age and body type
5. Include specific clothing details, colors, and accessories
6. Use professional photography terminology

Format each prompt as: "Using the provided image, change only the clothing to [specific outfit description]. Keep everything else in the image exactly the same, preserving the original facial features, skin tone, hair, facial structure, and composition. The person's identity and appearance should remain completely unchanged except for the outfit."

Return ONLY the prompts, one per line, numbered 1-${count}.`;
    }
  }

  private parsePromptsFromResponse(text: string, expectedCount: number): string[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const prompts: string[] = [];
    
    for (const line of lines) {
      // Remove numbering (1., 2., etc.) and extract the prompt
      const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
      if (cleanLine.length > 0) {
        prompts.push(cleanLine);
      }
    }
    
    console.log(`📋 Parsed ${prompts.length} prompts from response`);
    prompts.forEach((prompt, index) => {
      console.log(`📝 Prompt ${index + 1}: ${prompt.substring(0, 100)}...`);
    });
    
    return prompts.slice(0, expectedCount);
  }


  async generateImages(
    originalImageUri: string,
    prompts: string[],
    variationType: 'hairstyle' | 'outfit',
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<GeneratedImage[]> {
    try {
      console.log(`🎨 Starting image generation for ${prompts.length} prompts using inpainting approach`);
      console.log(`📝 First prompt: ${prompts[0]?.substring(0, 100)}...`);
      
      const generatedImages: GeneratedImage[] = [];
      console.log('🔄 Converting image to base64...');
      const base64Image = await this.convertImageToBase64(originalImageUri);
      console.log('✅ Image converted to base64 successfully');
      
      for (let i = 0; i < prompts.length; i++) {
        console.log(`🎯 Generating image ${i + 1}/${prompts.length}`);
        console.log(`📝 Prompt: ${prompts[i]}`);
        
        if (onProgress) {
          onProgress({
            step: 'generating',
            progress: Math.round(((i + 1) / prompts.length) * 100),
            message: `Generating image ${i + 1} of ${prompts.length}...`
          });
        }

        // Retry logic for image generation
        const maxRetries = 3;
        let imageGenerated = false;
        
        for (let retryAttempt = 1; retryAttempt <= maxRetries && !imageGenerated; retryAttempt++) {
          try {
            console.log(`⏳ Sending request to Gemini for image ${i + 1} (attempt ${retryAttempt}/${maxRetries})...`);
            const startTime = Date.now();
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Image generation timeout after 60 seconds')), 60000);
            });
            
            // Use inpainting approach: pass original image with text prompt for editing
            const generationPromise = this.imageModel.generateContent([
              {
                inlineData: {
                  data: base64Image,
                  mimeType: 'image/jpeg'
                }
              },
              prompts[i]
            ]);
            
            const result = await Promise.race([generationPromise, timeoutPromise]);

            const response = await result.response;
            const generationTime = Date.now() - startTime;
            console.log(`⏱️ Image ${i + 1} generated in ${generationTime}ms`);
            
            // Extract image data from response
            let imageFound = false;
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                console.log(`🖼️ Image data found for image ${i + 1}`);
                const imageData = part.inlineData.data;
                const imageUri = await this.saveImageToFile(imageData);
                
                generatedImages.push({
                  id: `generated-${Date.now()}-${i}`,
                  uri: imageUri,
                  variationType,
                  prompt: prompts[i]
                });
                console.log(`✅ Image ${i + 1} saved successfully`);
                imageFound = true;
                imageGenerated = true;
                break;
              }
            }
            
            if (!imageFound) {
              console.warn(`⚠️ No image data found in response for image ${i + 1}`);
              console.log('Response structure:', JSON.stringify(response, null, 2));
            }
          } catch (error) {
            console.error(`❌ Error generating image ${i + 1} (attempt ${retryAttempt}/${maxRetries}):`, error);
            
            // Check if it's a retryable error
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('overloaded') || errorMessage.includes('quota')) {
              if (retryAttempt < maxRetries) {
                const delay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                console.error(`❌ Failed to generate image ${i + 1} after ${maxRetries} attempts`);
              }
            } else {
              // Non-retryable error, break out of retry loop
              console.error('❌ Non-retryable error, skipping image');
              break;
            }
          }
        }
      }

      console.log(`🎉 Image generation complete! Generated ${generatedImages.length} images`);
      return generatedImages;
    } catch (error) {
      console.error('❌ Error in generateImages:', error);
      throw new Error('Failed to generate images');
    }
  }

  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        return await this.convertImageToBase64Web(imageUri);
      } else {
        // Use expo-file-system for native platforms
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  private async convertImageToBase64Web(imageUri: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        // Convert to base64
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataURL.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        
        resolve(base64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUri;
    });
  }

  private async saveImageToFile(imageData: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // For web, create a data URL and return it
        return `data:image/jpeg;base64,${imageData}`;
      } else {
        // For native platforms, save to file system
        const fileName = `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, imageData, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        return fileUri;
      }
    } catch (error) {
      console.error('Error saving image:', error);
      throw new Error('Failed to save generated image');
    }
  }

  private parseImageAnalysis(text: string): ImageAnalysis {
    // Simple parsing - in a real app, you might want more robust parsing
    const lines = text.split('\n').map(line => line.trim());
    
    const analysis: ImageAnalysis = {
      gender: 'unknown',
      ageRange: 'unknown',
      hairColor: 'unknown',
      hairLength: 'unknown',
      hairStyle: 'unknown',
      faceShape: 'unknown',
      skinTone: 'unknown',
      eyeColor: 'unknown',
      bodyType: 'unknown',
      clothingStyle: 'unknown',
      overallStyle: 'unknown'
    };

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('gender')) {
        analysis.gender = this.extractValue(line);
      } else if (lowerLine.includes('age')) {
        analysis.ageRange = this.extractValue(line);
      } else if (lowerLine.includes('hair color')) {
        analysis.hairColor = this.extractValue(line);
      } else if (lowerLine.includes('hair length')) {
        analysis.hairLength = this.extractValue(line);
      } else if (lowerLine.includes('hair style') || lowerLine.includes('hairstyle')) {
        analysis.hairStyle = this.extractValue(line);
      } else if (lowerLine.includes('face shape')) {
        analysis.faceShape = this.extractValue(line);
      } else if (lowerLine.includes('skin tone') || lowerLine.includes('skin')) {
        analysis.skinTone = this.extractValue(line);
      } else if (lowerLine.includes('eye color')) {
        analysis.eyeColor = this.extractValue(line);
      } else if (lowerLine.includes('body type') || lowerLine.includes('build')) {
        analysis.bodyType = this.extractValue(line);
      } else if (lowerLine.includes('clothing style')) {
        analysis.clothingStyle = this.extractValue(line);
      } else if (lowerLine.includes('overall style') || lowerLine.includes('aesthetic')) {
        analysis.overallStyle = this.extractValue(line);
      }
    });

    return analysis;
  }

  private extractValue(line: string): string {
    // Extract value after colon or dash
    const match = line.match(/[:\-]\s*(.+)/);
    return match ? match[1].trim() : 'unknown';
  }
}

export { GeminiService };
export default GeminiService;
