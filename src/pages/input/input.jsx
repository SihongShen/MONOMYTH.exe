import React, { useState, useEffect, useRef }from 'react';
import Header from '../../components/header/header.jsx';
import Footer from '../../components/footer/footer.jsx';
import './input.css';

export default function InputPage({ onComplete }) {
    const [step, setStep] = useState(0); 
    // 0: core word/question, 1: name, 2: loading
    const [seed, setSeed] = useState('');
    const [name, setName] = useState('');
    const [progress, setProgress] = useState(0);

    const inputRef = useRef(null);

    // auto focus input
    useEffect(() => {
        if (inputRef.current && step < 2){
            inputRef.current.focus();
        }
    }, [step]);

    // handle enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (step === 0 && seed.trim()) {
                setStep(1);
            } else if (step === 1 && name.trim()) {
                startLoadingSequence();
            }
        }
    };

    // loading sequence
    const startLoadingSequence = () => {
        setStep(2);
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 5;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    onComplete(seed, name);
                }, 500);
            }
            setProgress(currentProgress);
        }, 50);
    };

    return (
        <div className="input-page-container">
            <Header />

            <div className="input-content-wrapper">
                {/* 1: core word input */}
                {step === 0 && (
                    <div className="animate-fade-in">
                        <label className="input-label">
                            {">"} What is the most important thing in your life?
                        </label>
                        
                        <div className="input-field-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="retro-input-field"
                                placeholder=""
                                autoComplete="off"
                            />

                            <div className="input-mirror-display">
                                {seed ? (
                                    <span>{seed}</span>
                                ) : (
                                    <span className="placeholder-text"></span>
                                )}
                                <span className="blinking-cursor">|</span>
                            </div>
                        </div>

                        <div className="input-hint">
                            eg: love / 爱 / liebe / aimer / freedom / power / ...
                        </div>
                    </div>
                )}

                {/* 2: hero name input */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <label className="input-label">
                            {">"} The name of the hero is?
                        </label>
                        
                        <div className="input-field-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="retro-input-field"
                                autoComplete="off"
                            />

                            <div className="input-mirror-display">
                                {name ? (
                                    <span>{name}</span>
                                ) : (
                                    <span className="placeholder-text"></span>
                                )}
                                <span className="blinking-cursor">|</span>
                            </div>
                        </div>
                        <div className="input-hint">
                            PRESS [ENTER] TO INITIATE
                        </div>
                    </div>
                )}

                {/* 3：Loading Progress Bar */}
                {step === 2 && (
                    <div className="animate-fade-in progress-section">
                        <div className="progress-header">
                            <span>Initializing Neural Link...</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        
                        <div className="progress-frame">
                            <div 
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <div className="system-logs">
                            <p>{">"} PARSING SEED: "{seed.toUpperCase()}"...</p>
                            {progress > 30 && <p>{">"} IDENTIFYING HERO: "{name.toUpperCase()}"...</p>}
                            {progress > 60 && <p>{">"} GENERATING MYTHOS PROTOCOLS...</p>}
                            {progress > 90 && <p>{">"} SYSTEM READY.</p>}
                        </div>
                    </div>
                )}

            </div>
            <Footer />
        </div>
    );
}