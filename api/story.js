// api/story.js — Vercel Serverless Function
// API key lives ONLY here via process.env, never in the frontend bundle
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../src/constants.js";
import { getGeminiApiKey } from "./_lib/env.js";

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // `history` is the full Gemini-format conversation so far (for stateless resumption)
    const { message, history = [] } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 1.2,
      },
      history,
    });

    const response = await chat.sendMessage({ message });
    return res.status(200).json({ result: response.text });

  } catch (error) {
    console.error("Story API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}