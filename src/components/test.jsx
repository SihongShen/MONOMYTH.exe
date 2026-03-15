// test file for image generator
import React, { useState } from 'react';
import GeminiCover from '../models/coverGenerator'; 

export default function SystemCheck() {
    const [textStatus, setTextStatus] = useState("IDLE");
    const [textResult, setTextResult] = useState("");
    const [showTestImage, setShowTestImage] = useState(false);

    const testTextApi = async () => {
        setTextStatus("PINGING...");
        try {
            const res = await fetch('/api/story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Reply with 'System Operational' if you receive this.", history: [] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setTextStatus("SUCCESS");
            setTextResult(data.result);
        } catch (e) {
            setTextStatus("FAILED");
            setTextResult(e.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: '10px', right: '10px', 
            background: 'rgba(0,0,0,0.9)', border: '1px solid #0f0', 
            padding: '20px', zIndex: 9999, color: '#0f0', fontFamily: 'monospace',
            maxWidth: '300px'
        }}>
            <h3>🛠 SYSTEM DIAGNOSTICS</h3>

            {/* cover test */}
            <div style={{borderTop: '1px dashed #0f0', paddingTop: '10px'}}>
                <button 
                    onClick={() => setShowTestImage(!showTestImage)} 
                    style={{background: '#0f0', color: '#000', border: 'none', padding: '5px 10px', cursor: 'pointer'}}
                >
                    {showTestImage ? "HIDE COVER TEST" : "TEST COVER GEN"}
                </button>
                
                {showTestImage && (
                    <div style={{marginTop: '10px'}}>
                        <p style={{fontSize: '10px', color: '#aaa'}}>Rendering GeminiCover component with test prompt...</p>
                        <GeminiCover prompt="A futuristic cyberpunk city with neon lights and rain" />
                    </div>
                )}
            </div>
        </div>
    );
}