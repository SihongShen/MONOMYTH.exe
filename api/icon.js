// api/icon.js — Vercel Serverless Function
// Generates background icons via Imagen. API key never leaves the server.
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./_lib/env.js";

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `A set of 6 distinct minimalist line art icons inspired by the concept keyword '${keyword}', designed as cyberpunk UI elements. Black background, monochrome light grey lines. The icons should be simple, geometric, and look like digital blueprints or HUD elements. Arranged in a grid. No text, no gradients. Layout: 3 columns by 2 rows grid.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: { numberOfImages: 1, aspectRatio: "16:9" },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) throw new Error("No image data received.");

    return res.status(200).json({ imageBase64: `data:image/png;base64,${imageBytes}` });

  } catch (error) {
    console.error("Icon API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
