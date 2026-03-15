import React, { useState, useEffect, useRef } from 'react';

export default function GeminiCover({ prompt, onImageGenerated }) {
    const [imgBase64, setImgBase64] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const requestingPromptRef = useRef(null);
    const maxRetries = 2;

    useEffect(() => {
        console.log("🎨 GeminiCover: Component Mounted/Updated");
        console.log("📩 Received Prompt:", prompt);

        if (!prompt || prompt.trim() === '') {
            console.warn("⚠️ GeminiCover: Prompt is empty or undefined. Aborting.");
            return;
        }

        if (requestingPromptRef.current === prompt) {
            console.log("🔄 GeminiCover: Prompt matches previous request. Skipping duplicate generation.");
            return;
        }

        requestingPromptRef.current = prompt;
        setRetryCount(0);
        setError(null);
        setImgBase64(null);

        const generate = async (attempt = 0) => {
            setIsLoading(true);
            try {
                console.log(`🖼️ Generating Cover (Attempt ${attempt + 1}/${maxRetries + 1})`);

                const res = await fetch('/api/cover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Cover generation failed');
                }

                const data = await res.json();
                if (!data.imageBase64) {
                    throw new Error("No image data received. Safety filter might be triggered.");
                }

                setImgBase64(data.imageBase64);
                setIsLoading(false);
                setError(null);
                console.log("✅ Cover Image Generated Successfully");

                if (onImageGenerated) {
                    onImageGenerated(data.imageBase64);
                }
            } catch (err) {
                console.error(`❌ Cover Generation Failed (Attempt ${attempt + 1}):`, err.message);
                
                // retry logic
                if (attempt < maxRetries) {
                    console.log(`🔄 Retrying... (${attempt + 1}/${maxRetries})`);
                    setRetryCount(attempt + 1);
                    setIsLoading(false);
                    
                    // retry after delay
                    setTimeout(() => {
                        generate(attempt + 1);
                    }, 1500);
                } else {
                    setError("IMAGE_GENERATION_FAILED");
                    console.log("❌ Max retries reached. Giving up.");
                    // Call callback with null to indicate failure
                    if (onImageGenerated) {
                        onImageGenerated(null);
                    }
                    setIsLoading(false);
                }
            }
        };

        generate(0);
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
                <div style={{color: '#888', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', padding: '20px'}}>
                    <div>[RECONSTRUCTING MYTHOLOGICAL ARCHIVE...]</div>
                    {retryCount > 0 && <div style={{fontSize: '10px', marginTop: '10px', color: '#666'}}>Attempt {retryCount + 1} of {maxRetries + 1}</div>}
                </div>
            )}
            
            {!isLoading && error && (
                <div style={{color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px'}}>
                    <div>[IMAGE RECONSTRUCTION FAILED]</div>
                    <div style={{fontSize: '10px', marginTop: '5px'}}>The archive could not be retrieved</div>
                </div>
            )}

            {imgBase64 && !isLoading && (
                <img 
                    src={imgBase64} 
                    alt="Ending Cover" 
                    style={{
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        animation: 'fadeIn 1s ease-in',
                        filter: 'sepia(0.2) contrast(1.1)'
                    }}
                />
            )}

            {!isLoading && !error && !imgBase64 && (
                <div style={{color: '#555', fontSize: '12px'}}>
                    [AWAITING IMAGE DATA...]
                </div>
            )}
        </div>
    );
}