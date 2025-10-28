import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
  private apiKeys: string[];
  private currentApiKeyIndex: number = 0;
  private clients: GoogleGenerativeAI[] = [];

  constructor() {
    // Initialize API keys from environment variables
    this.apiKeys = [];
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`] || process.env.GEMINI_API_KEY;
      if (key) {
        this.apiKeys.push(key);
      }
    }

    if (this.apiKeys.length === 0) {
      throw new Error('No Gemini API keys found in environment variables');
    }

    // Initialize clients for each API key
    this.clients = this.apiKeys.map(key => new GoogleGenerativeAI(key));
    
    console.log(`🔑 Initialized Gemini service with ${this.apiKeys.length} API keys`);
  }

  private switchApiKey(): void {
    this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length;
    console.log(`🔄 Switched to API key ${this.currentApiKeyIndex + 1}/${this.apiKeys.length}`);
  }

  private getCurrentClient(): GoogleGenerativeAI {
    return this.clients[this.currentApiKeyIndex];
  }

  async embedText(text: string, retryCount: number = 0, maxRetries: number = 3): Promise<number[]> {
    try {
      const genAI = this.getCurrentClient();
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      
      const result = await model.embedContent(text);
      const embedding = result.embedding;
      
      return embedding.values;
    } catch (error: any) {
      if (retryCount < maxRetries) {
        if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
          console.error(`🚨 API key ${this.currentApiKeyIndex + 1} limit exhausted, switching...`);
          this.switchApiKey();
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
          return this.embedText(text, retryCount + 1, maxRetries);
        } else if (error.message?.includes("503") || error.message?.includes("Service Unavailable")) {
          console.error("⏳ Service is unavailable. Retrying in 3 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return this.embedText(text, retryCount + 1, maxRetries);
        } else if (error.message?.includes("500") || error.message?.includes("Internal Server Error")) {
          console.error("⚠️ Internal server error. Retrying in 2 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return this.embedText(text, retryCount + 1, maxRetries);
        } else {
          console.error("⚠️ Error embedding text:", error.message);
          throw error;
        }
      } else {
        console.error("❌ Maximum retry attempts reached for embedding. Using fallback embedding.");
        // Return a fallback embedding (zeros) instead of crashing
        return new Array(768).fill(0);
      }
    }
  }

  async generateReply(promptText: string, retryCount: number = 0, maxRetries: number = 3): Promise<string> {
    try {
      const genAI = this.getCurrentClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const result = await model.generateContent(promptText);
      const response = await result.response;
      
      return response.text() || "No response generated";
    } catch (error: any) {
      if (retryCount < maxRetries) {
        if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
          console.error(`🚨 API key ${this.currentApiKeyIndex + 1} limit exhausted, switching...`);
          this.switchApiKey();
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
          return this.generateReply(promptText, retryCount + 1, maxRetries);
        } else if (error.message?.includes("503") || error.message?.includes("Service Unavailable")) {
          console.error("⏳ Service is unavailable. Retrying in 3 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return this.generateReply(promptText, retryCount + 1, maxRetries);
        } else if (error.message?.includes("500") || error.message?.includes("Internal Server Error")) {
          console.error("⚠️ Internal server error. Retrying in 2 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return this.generateReply(promptText, retryCount + 1, maxRetries);
        } else {
          console.error("⚠️ Error generating reply:", error.message);
          throw error;
        }
      } else {
        console.error("❌ Maximum retry attempts reached for generation. Using fallback response.");
        // Return a fallback response instead of crashing
        return "I apologize, but I'm currently experiencing technical difficulties. Please try again later or contact support if the issue persists.";
      }
    }
  }

  async generateWithContext(context: string[], userMessage: string, agentConfig: any): Promise<string> {
    try {
      const genAI = this.getCurrentClient();
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: agentConfig.temperature || 0.7,
          topP: agentConfig.topP || 0.8,
          topK: agentConfig.topK || 40,
          maxOutputTokens: agentConfig.maxTokens || 2048,
        }
      });

      // Build context-aware prompt
      const contextText = context.join('\n\n');
      const prompt = `
You are ${agentConfig.name || 'an AI assistant'}. ${agentConfig.description || ''}

Tone: ${agentConfig.tone || 'friendly'}

Relevant context from your knowledge base:
${contextText}

User message: ${userMessage}

Please provide a helpful response based on the context above. If the context doesn't contain relevant information, let the user know and offer to help in other ways.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text() || "No response generated";
    } catch (error: any) {
      console.error("Error generating context-aware reply:", error);
      return "I apologize, but I'm currently experiencing technical difficulties. Please try again later.";
    }
  }

  // Get service status
  getStatus(): { apiKeysCount: number; currentKeyIndex: number } {
    return {
      apiKeysCount: this.apiKeys.length,
      currentKeyIndex: this.currentApiKeyIndex
    };
  }
}

// Create singleton instance
const geminiService = new GeminiService();

// Export the functions with retry logic
export async function embedText(text: string): Promise<number[]> {
  return geminiService.embedText(text);
}

export async function generateReply(promptText: string): Promise<string> {
  return geminiService.generateReply(promptText);
}

export async function generateWithContext(context: string[], userMessage: string, agentConfig: any): Promise<string> {
  return geminiService.generateWithContext(context, userMessage, agentConfig);
}

// Export service for advanced usage
export { geminiService };
