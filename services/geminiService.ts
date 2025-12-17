
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GardenPreferences, GardenLayout } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateGardenLayout(prefs: GardenPreferences): Promise<GardenLayout> {
    const prompt = `Design a dream garden with the following preferences:
      Style: ${prefs.style}
      Size: ${prefs.size}
      Climate: ${prefs.climate}
      Features: ${prefs.features.join(', ')}
      Budget: ${prefs.budget}
      Desired Colors: ${prefs.colors}
      
      Provide a structured layout including zoning and specific plant suggestions suitable for this climate and style.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            zoning: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  zone: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["zone", "description"]
              }
            },
            suggestedPlants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "description", "reason"]
              }
            }
          },
          required: ["title", "description", "zoning", "suggestedPlants"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async generateGardenImage(layout: GardenLayout, prefs: GardenPreferences): Promise<string> {
    const prompt = `High-quality landscape architectural render of a ${prefs.style} garden. 
      Includes ${prefs.features.join(', ')}. 
      Climate is ${prefs.climate}. 
      Dominant colors: ${prefs.colors}. 
      Layout focus: ${layout.title}. 
      Photorealistic, professional photography, natural sunlight, 8k resolution.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  }

  async editGardenImage(base64Image: string, editPrompt: string): Promise<string> {
    // Extract base64 content if it has the data:image prefix
    const dataMatch = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = dataMatch ? dataMatch[1] : 'image/png';
    const data = dataMatch ? dataMatch[2] : base64Image;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to edit image");
  }
}

export const geminiService = new GeminiService();
