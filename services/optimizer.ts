
import { GoogleGenAI, Type } from "@google/genai";
import { Address, OptimizedStop, RouteConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geocodeAndOptimize = async (
  addresses: Address[],
  config: RouteConfig
): Promise<OptimizedStop[]> => {
  // Using gemini-2.5-flash to support Google Maps grounding tool for precise location data
  const prompt = `
    You are a professional logistics optimization engine. 
    1. Geocode the following addresses into [lat, lng] coordinates with high precision.
    2. Optimize the delivery sequence starting from the Depot: "${config.depot}".
    3. Respect the "Return to Depot" setting: ${config.returnToStart ? 'YES' : 'NO'}.
    
    Addresses:
    ${addresses.map(a => `- ${a.raw} (ID: ${a.id}, Phone: ${a.phone || 'N/A'})`).join('\n')}

    Return a JSON array of stops in optimized order. 
    Format: [{"id": "...", "lat": 0.0, "lng": 0.0, "sequenceOrder": 0, "isValid": true}]
    Ensure the sequence starts with the depot at order 0.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        // responseMimeType is not allowed when using googleMaps tool
      },
    });

    // Extract JSON from the potentially markdown-wrapped response
    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const data = JSON.parse(jsonMatch[0]);
    return data.map((item: any) => {
      const original = addresses.find(a => a.id === item.id);
      return {
        ...original,
        ...item
      };
    });
  } catch (e) {
    console.error("Failed to parse optimizer response", e);
    // Fallback: return as-is in simple order
    return addresses.map((a, i) => ({ ...a, sequenceOrder: i, lat: 0, lng: 0 }));
  }
};
