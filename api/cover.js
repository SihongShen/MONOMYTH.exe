// api/cover.js — Vercel Serverless Function
// Generates cover art via Imagen. API key never leaves the server.
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./_lib/env.js";

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const finalPrompt = `${prompt}, classical oil painting style, masterpiece, highly detailed, NO text, NO neon`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: { numberOfImages: 1, aspectRatio: "16:9" },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) throw new Error("No image data received. Safety filter may have been triggered.");

    return res.status(200).json({ imageBase64: `data:image/png;base64,${imageBytes}` });

  } catch (error) {
    console.error("Cover API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
