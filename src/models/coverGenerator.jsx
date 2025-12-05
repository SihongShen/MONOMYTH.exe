import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

export default function GeminiCover({ prompt, onImageGenerated }) {
    const [imgBase64, setImgBase64] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const requestingPromptRef = useRef(null);

    useEffect(() => {
        console.log("🎨 GeminiCover: Component Mounted/Updated");
        console.log("📩 Received Prompt:", prompt);

        if (!prompt) {
            console.warn("⚠️ GeminiCover: Prompt is empty or undefined. Aborting.");
            return;
        }

        if (requestingPromptRef.current === prompt) {
            console.log("🔄 GeminiCover: Prompt matches previous request. Skipping duplicate generation.");
            return;
        }

        requestingPromptRef.current = prompt;

        const generate = async () => {
            setIsLoading(true);
            try {
                // initiate model
                const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

                // emphasize the style
                const finalPrompt = `${prompt}, classical oil painting style, masterpiece, highly detailed, NO text, NO neon`;
                
                console.log("Generating Cover with prompt:", finalPrompt);

                // fetch api
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001', 
                    prompt: finalPrompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: "16:9",
                    },
                });

                const generatedImage = response.generatedImages?.[0];
                
                // parse Base64
                if (generatedImage?.image?.imageBytes) {
                    const fullBase64 = `data:image/png;base64,${generatedImage.image.imageBytes}`;
                    setImgBase64(fullBase64);

                    // send to parent component
                    if (onImageGenerated) {
                        onImageGenerated(fullBase64);
                    }
                } else {
                    throw new Error("No image data received. Safety filter might be triggered.");
                }
            } catch (err) {
                console.error("Cover Generation Failed:", err);
                setError("IMAGE DATA CORRUPTED");
            } finally {
                setIsLoading(false);
            }
        };

        generate();
    }, [prompt, onImageGenerated]);

    return (
        <div style={{
            width: '100%',
            aspectRatio: '21/9',
            backgroundColor: '#111',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
        }}>
            {isLoading && (
                <div style={{color: '#888', fontFamily: 'monospace', fontSize: '12px'}}>
                    [RECONSTRUCTING MYTHOLOGICAL ARCHIVE...]
                </div>
            )}
            
            {!isLoading && error && (
                <div style={{color: '#555', fontSize: '12px'}}>{error}</div>
            )}

            {imgBase64 && (
                <img 
                    src={imgBase64} 
                    alt="Ending Cover" 
                    style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        animation: 'fadeIn 1s ease-in',
                        filter: 'sepia(0.2) contrast(1.1)'
                    }}
                />
            )}
        </div>
    );
}