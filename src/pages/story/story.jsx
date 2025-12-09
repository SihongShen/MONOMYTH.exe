import React, { useState, useRef, useEffect} from 'react';
// get prompt instructions
import { SYSTEM_INSTRUCTION, MAX_STEPS } from '../../constants.js';
import { GoogleGenAI } from "@google/genai";
// css file
import './story.css';
import Header from '../../components/header/header.jsx';
import Footer from '../../components/footer/footer.jsx';
import HandChoiceController from '../../models/handChoice.jsx';
import GeminiCover from '../../models/coverGenerator.jsx';
import IconGenerator from '../../models/iconGenerator.jsx';
import ProgressiveBackground from '../../components/background.jsx';
// pdf output library
import html2pdf from 'html2pdf.js';
// import SystemCheck from '../../components/test.jsx';

// typewriter effect for story text
const Typewriter = ({ text, speed = 20, isLatest, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const currentTextRef = useRef('');
    const hasCompletedRef = useRef(false);
    
    useEffect(() => {
        if (!isLatest) {
            setDisplayedText(text);
            return;
        }

        if ( text != currentTextRef.current ) {
            currentTextRef.current = text;
            hasCompletedRef.current = false;
            setDisplayedText('');
        }

        if (hasCompletedRef.current) {
            return;
        }

        let i = displayedText.length;
        if (i === 0 && text !== displayedText) {
            setDisplayedText('');
        }

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => text.slice(0, prev.length + 1));
                i++;
            } else {
                clearInterval(timer);
                if (!hasCompletedRef.current) {
                    hasCompletedRef.current = true;
                    if (onComplete) onComplete();
                }
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, isLatest, speed, onComplete]);

    return (
        <span>
            {displayedText}
            {isLatest && <span className="cursor"></span>}
        </span>
    );
};

// main story display
export default function TestStoryPage({ seed, name }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // for storing story nodes and contents
    const [chatSession, setChatSession] = useState(null);
    const [history, setHistory] = useState([]);
    // reading choosing
    const [storyState, setStoryState] = useState('READING');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const hasInitialized = useRef(false);
    // auto-scroll to bottom when new content is added
    const bottomRef = useRef(null);
    // save cover img data
    const [finalCoverBase64, setFinalCoverBase64] = useState(null);
    // icon
    const [bgIconsUrl, setBgIconsUrl] = useState(null);
    // save pdf template
    const printRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, loading, history.length]);

    // Initialize game when seed and name are available
    useEffect(() => {
        if (seed && name && !hasInitialized.current) {
            hasInitialized.current = true;
            initiateGame();
        }
    }, [seed, name]);

    const initiateGame = async () => {
        setLoading(true);
        setError(null);
        setHistory([]);
        setIsModalOpen(false);
        setStoryState('READING');
        setFinalCoverBase64(null);

        try {
            // initiate LLM
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("API Key lost！Please check .env file.");
            }

            const genAI = new GoogleGenAI({apiKey: apiKey});

            const chat = genAI.chats.create({
                model: "gemini-2.5-flash",
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    temperature: 1.2,
                },
            });
            setChatSession(chat);

            const response = await chat.sendMessage({
                message: `User Seed: "${seed}". Hero Name: "${name}". Begin the story at Step 1. Output JSON.`
            })

            const node = parseAndValidate(response.text);
            setHistory([node]);

        } catch (err) {
            setError("Start Error " + err.message);
            hasInitialized.current = false;
        } finally {
            setLoading(false);
        }
    };

    // choosing part logic
    const handleChoice =  async (choiceId, shortDesc) => {
        if(!chatSession) return;
        
        // Update history with selected choice
        const currentStepIndex = history.length - 1;
        const newHistory = [...history];
        newHistory[currentStepIndex].selectedId = choiceId;
        setHistory(newHistory);

        setStoryState('PROCESSING');
        setLoading(true);

        try {
            // next step number
            const nextStep = history.length + 1;
            const isLastStep = nextStep === MAX_STEPS;
            // Determine if this is the epilogue step
            const isEpilogue = nextStep > MAX_STEPS;

            let prompt = "";

            if (isEpilogue) {
                prompt = `
                    User choice: ${choiceId} (${shortDesc}).
                    MISSION: The journey is complete. Generate the **Epilogue** (Step ${nextStep}).
                    
                    REQUIRED JSON STRUCTURE:
                    {
                      "narrative": "Final reflection wrapping up the journey...",
                      "grandTitle": "AN EPIC TITLE FOR THIS LEGEND",
                      "choices": [],
                      "coverArtPrompt": "A highly detailed description of the final scene for an oil painting generator...",
                      "step": ${nextStep},
                      "stage": "THE END"
                    }
                    `
            } else {
                    prompt = `
                        User choice: ${choiceId} (${shortDesc}).
                        MISSION: Generate **Step ${nextStep}** of ${MAX_STEPS}.
                        ${isLastStep ? "**IMPORTANT: This is the FINAL STEP (Conclusion). Bring the story to a close.**" : "Keep the narrative going, do NOT end the story yet."}
                    `;
            }

            const response = await chatSession.sendMessage({
                message: prompt
            });

            const nextNode = parseAndValidate(response.text);

            nextNode.step = nextStep;

            // solving grandTitle missing problem
            const isStoryEnded = isEpilogue || (!nextNode.choices || nextNode.choices.length === 0);

            if (isStoryEnded) {
                nextNode.stage = "THE END";
                if (!nextNode.grandTitle && nextNode.title) {
                    nextNode.grandTitle = nextNode.title;
                }
                if (!nextNode.grandTitle) {
                    nextNode.grandTitle = `THE LEGEND OF ${name ? name.toUpperCase() : 'THE HERO'}`;
                }
                
                if (!nextNode.choices) {
                    nextNode.choices = [];
                }
            }

            setHistory(prev => [...prev, nextNode]);

            setStoryState('READING');
        } catch (err) {
            setError("Choice Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const parseAndValidate = (text) => {
        const cleanJsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJsonStr);
    }

    const handleTypewriterComplete = () => {
        if (!loading) {
            setTimeout(() => {
                setStoryState('CHOOSING');
            }, 5000);
        }
    };

    const generatePDF = async () => {
        const element = printRef.current;

        const coverImg = element.querySelector('img');

        if (coverImg && !coverImg.complete) {
            // waiting for the img to load
            await new Promise((resolve) => {
                coverImg.onload = resolve;
                // if failed, continue
                coverImg.onerror = resolve;
            });
        }
        const opt = {
            margin:       0.5,
            filename:     `${name}_Mythos_Log.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        setTimeout(() => {
            html2pdf().set(opt).from(element).save();
        }, 500);
    };

    const currentNode = history.length > 0 ? history[history.length - 1] : null;
    const currentStepCount = history.length;
    const choices = currentNode?.choices || [];
    const showHandControl = storyState === 'CHOOSING' && choices.length >=2 && !currentNode?.selectedId && !loading;

    return (
        <div className="retro-container">

            <IconGenerator 
                keyword={seed} 
                onIconsGenerated={setBgIconsUrl} 
            />

            <Header />
            <div className="status-bar">
                <button onClick={() => window.location.reload()} className="reset-btn">
                    [SYSTEM_RESET]
                </button>
            </div>

            <ProgressiveBackground 
                iconsUrl={bgIconsUrl} 
                currentStep={currentStepCount} 
            />

            {error && <div className="error-msg">ERROR: {error}</div>}

            {showHandControl && (
                <HandChoiceController 
                    leftOption={choices[0].shortDesc}
                    rightOption={choices[1].shortDesc}
                    onSelect={(textLabel) => {
                        const choice = choices.find(c => c.shortDesc === textLabel);
                        if (choice) {
                            handleChoice(choice.id, choice.shortDesc);
                        }
                    }}
                />
            )}

            <div className="story-log">
                {history.map((node, index) => {
                    const userSelection = node.selectedId; 
                    const isLatest = index === history.length - 1;
                    const selectedChoice = node.choices?.find(c => c.id === userSelection);

                    return (
                        <div key={index} className="story-node">
                            {node.title && (
                                <h2 className="node-title">
                                    {node.title}
                                </h2>
                            )}

                            <div className="retro-text">
                                <Typewriter text={node.narrative} isLatest={isLatest} speed={25} onComplete={isLatest ? handleTypewriterComplete : undefined} />
                            </div>

                            {!userSelection ? (
                                node.choices && node.choices.length > 0 ? (
                                    (!isLatest || choices.length < 2) && (
                                        <div className="retro-choices">
                                            {node.choices.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => handleChoice(c.id, c.shortDesc)}
                                                    disabled={loading || !isLatest}
                                                    className="retro-choice-btn"
                                                >
                                                    [{c.id}] {c.shortDesc}
                                                </button>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <div className="system-msg">
                                        <div>... END OF TRANSMISSION ...</div>
                                        {node.grandTitle && (
                                            <div 
                                                className="click-to-open"
                                                onClick={() => setIsModalOpen(true)}
                                                style={{cursor: 'pointer', marginTop: '10px', textDecoration: 'underline'}}
                                            >
                                                &gt; ACCESS FINAL RECORD FILE
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="selected-result retro-text">
                                    {selectedChoice && (
                                        <Typewriter 
                                            text={selectedChoice.text || `Action [${selectedChoice.id}] executed.`} 
                                            isLatest={isLatest} 
                                            speed={25} 
                                        />
                                     )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {loading && (
                    <div className="system-msg">
                        PROCESSING INCOMING DATA STREAM...
                    </div>
                )}
                
                <div ref={bottomRef} />
            </div>

            <Footer />

            {/* invisible part for saving PDF */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={printRef} style={{ 
                                            padding: '40px',
                                            fontFamily: 'Georgia, serif',
                                            color: '#000',
                                            background: '#fff',
                                            width: '650px',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}>
                    
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0' }}>
                            {history.length > 0 && history[history.length - 1].grandTitle}
                        </h1>
                        <p style={{ fontSize: '18px', fontStyle: 'italic' }}>The Chronicle of {name}</p>
                        <p style={{ fontSize: '12px', color: '#666' }}>Seed: {seed}</p>
                    </div>

                    {finalCoverBase64 && (
                        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                            <img src={finalCoverBase64.startsWith('data:') 
                                    ? finalCoverBase64 
                                    : `data:image/png;base64,${finalCoverBase64}`}
                                    alt="Cover" style={{ maxWidth: '100%', border: '1px solid #333' }} />
                        </div>
                    )}

                    {history.map((node, index) => {
                        const selectedChoice = node.choices?.find(c => c.id === node.selectedId);
                        return (
                            <div key={index} style={{ marginBottom: '25px' }}>
                                <h3 style={{ fontSize: '18px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                                    Chapter {node.step}: {node.title || 'Untitled'}
                                </h3>
                                <p style={{ lineHeight: '1.6', fontSize: '14px', textAlign: 'italic' }}>
                                    {node.narrative}
                                </p>
                                {selectedChoice && (
                                    <div style={{ borderRadius: '4px', fontSize: '14px', fontStyle: 'italic' }}>
                                        {selectedChoice.text}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '12px', color: '#999' }}>
                        Generated by MONOMYTH System
                    </div>
                </div>
            </div>

            {isModalOpen && history.length > 0 && history[history.length - 1]?.grandTitle && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{color: '#555', marginBottom: '1rem'}}>MYTHOS COMPLETE</div>
                        
                        <h1 className="grand-title">
                            {history[history.length - 1].grandTitle}
                        </h1>

                        {/* Always render Cover, even if prompt is missing */}
                        <GeminiCover 
                            prompt={
                                history[history.length - 1].coverArtPrompt || 
                                `Epic greek fantasy oil painting of ${history[history.length - 1].grandTitle}, mysterious, divine light`
                            } 
                            onImageGenerated={(b64) => {
                                console.log("📸 Cover Image Generated:", b64 ? 'SUCCESS' : 'FAILED');
                                setFinalCoverBase64(b64);
                            }}
                        />

                        <p className="modal-text">
                            {history[history.length - 1].narrative}
                        </p>

                        <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px'}}>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="retro-choice-btn"
                                style={{fontSize: '14px', padding: '10px 20px'}}
                            >
                                REVIEW LOGS
                            </button>

                            <button 
                                onClick={() => window.location.reload()} 
                                className="restart-btn"
                            >
                                INITIATE NEW CYCLE
                            </button>

                            <button 
                                onClick={generatePDF} 
                                className="retro-choice-btn"
                            >
                                SAVE AS PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}