import React, { useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

export default function IconGenerator({ keyword, onIconsGenerated }) {
    // prevent multiple query for API
    const requestingKeywordRef = useRef(null);

    useEffect(() => {
        // check keyword
        if (!keyword || !onIconsGenerated) return;
        if (requestingKeywordRef.current === keyword) return;
        
        // lock current keyword
        requestingKeywordRef.current = keyword;

        const generate = async () => {
            // console.log(`[IconGen] Starting generation for keyword: "${keyword}"`);
            try {
                // initiate model
                const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

                // set prompt
                const prompt = `A set of 6 distinct minimalist line art icons inspired by the conceptor keyword '${keyword}', 
                                designed as cyberpunk UI elements. Black background, monochrome light grey lines (#CCCCCC). 
                                The icons should be simple, geometric, and look like digital blueprints or HUD elements. 
                                Arranged in a grid. No text, no gradients.
                                Layout: 3 columns by 2 rows grid.`;
                
                // fetch api
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001', 
                    prompt: prompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: "16:9",
                    },
                });

                const generatedImage = response.generatedImages?.[0];
                
                if (generatedImage?.image?.imageBytes) {
                    // parse Base64
                    const b64 = `data:image/png;base64,${generatedImage.image.imageBytes}`;
                    console.log(`[IconGen] Success for "${keyword}". Sending data to parent.`);
                    // send to parent component
                    onIconsGenerated(b64);
                } else {
                    throw new Error("No image data received from API.");
                }

            } catch (err) {
                console.error(`[IconGen] Failed for "${keyword}":`, err);
                onIconsGenerated(null);
            }
        };

        // 执行生成函数
        generate();

    }, [keyword, onIconsGenerated]);

    // no DOM rendered
    return null;
}