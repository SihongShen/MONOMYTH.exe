import React, { useState, useRef, useEffect} from 'react';
// get prompt instructions
import { SYSTEM_INSTRUCTION, MAX_STEPS } from '../../constants.js';
import { GoogleGenAI } from "@google/genai";
// css file
import './story.css';
import Header from '../../components/header/header.jsx';
import HandChoiceController from '../../models/handChoice.jsx';

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

export default function TestStoryPage({ seed, name }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // for storing story nodes and contents
    const [chatSession, setChatSession] = useState(null);
    const [history, setHistory] = useState([]);
    const [storyState, setStoryState] = useState('READING'); // reading choosing
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasInitialized = useRef(false);

    // auto-scroll to bottom when new content is added
    const bottomRef = useRef(null);
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

        try {
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
            if (isEpilogue) {
                nextNode.stage = "THE END";
                if (!nextNode.grandTitle && nextNode.title) {
                    nextNode.grandTitle = nextNode.title;
                }
                if (!nextNode.grandTitle) {
                    nextNode.grandTitle = `THE LEGEND OF ${name ? name.toUpperCase() : 'THE HERO'}`;
                }
                setIsModalOpen(true);
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
            setStoryState('CHOOSING');
        }
    };

    const currentNode = history.length > 0 ? history[history.length - 1] : null;
    const choices = currentNode?.choices || [];
    const showHandControl = storyState === 'CHOOSING' && choices.length >=2 && !currentNode?.selectedId && !loading;

    return (
        <div className="retro-container">
            <Header />
            <div className="status-bar">
                <button onClick={() => window.location.reload()} className="reset-btn">
                    [SYSTEM_RESET]
                </button>
            </div>

            {error && <div className="error-msg">ERROR: {error}</div>}

            {showHandControl && (
                <HandChoiceController 
                    leftOption={choices[0].shortDesc}  // 左边对应数组第一个
                    rightOption={choices[1].shortDesc} // 右边对应数组第二个
                    onSelect={(textLabel) => {
                        // 回调返回的是文字，我们需要找回对应的 ID
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

            {isModalOpen && history.length > 0 && history[history.length - 1]?.grandTitle && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{color: '#555', marginBottom: '1rem'}}>MYTHOS COMPLETE</div>
                        
                        <h1 className="grand-title">
                            {history[history.length - 1].grandTitle}
                        </h1>
                        
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}