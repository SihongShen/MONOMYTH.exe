import React, { useState, useRef, useEffect} from 'react';
// get prompt instructions
import { SYSTEM_INSTRUCTION, MAX_STEPS } from '../../constants.js';
import { GoogleGenAI } from "@google/genai";
// css file
import './story.css';

export default function TestStoryPage() {
    const [seed, setSeed] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // for storing story nodes and contents
    const [chatSession, setChatSession] = useState(null);
    const [history, setHistory] = useState([]);

    // auto-scroll to bottom when new content is added
    const bottomRef = useRef(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, loading]);

    const handleStartGame = async () => {
        if (!seed) return;
        setLoading(true);
        setError(null);
        setHistory([]);

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
                message: `User Seed: "${seed}". Begin the story at Step 1. Output JSON.`
            })

            const node = parseAndValidate(response.text);
            setHistory([node]);

        } catch (err) {
        setError("Start Error " + err.message);
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
                        1. Provide a final "narrative" wrapping up the soul's journey.
                        2. Provide a "grandTitle" (The name of this specific myth).
                        3. Leave "choices" empty [].
                        4. Keep the language consistent with previous steps.
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

            if (isEpilogue) nextNode.stage = "THE END";

            setHistory(prev => [...prev, nextNode]);
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

   return (
        <div className="retro-container" >
            {/* 顶部标题区 - 居中 */}
            <div className="text-center mb-10">
                <h1 className="retro-title-main">MONOMYTH TERMINAL</h1>
            </div>

            {/* 输入区 - 模拟旧控制台 */}
            <div className="retro-input-group max-w-3xl mx-auto">
                <div className="flex gap-4">
                    <span className="self-center font-bold text-xl">{'>'}</span>
                    <input 
                        type="text" 
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="INITIATE_SEED_SEQUENCE..."
                        className="retro-input flex-1"
                        disabled={history.length > 0} 
                        autoComplete="off"
                    />
                    <button 
                        onClick={handleStartGame}
                        disabled={loading || history.length > 0}
                        className="retro-btn px-6 py-2"
                    >
                        {history.length > 0 ? 'EXECUTING...' : 'RUN'}
                    </button>
                </div>
                {/* 重置按钮 */}
                {history.length > 0 && (
                    <div className="text-right mt-2">
                         <button onClick={() => window.location.reload()} className="text-xs hover:text-red-500 underline decoration-dotted">
                            [SYSTEM_RESET]
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="border border-red-500 text-red-500 p-4 mb-6 max-w-3xl mx-auto bg-black bg-opacity-50">ERROR: {error}</div>}

            {/* 故事列表区域 */}
            <div className="max-w-3xl mx-auto pb-20">
                {history.map((node, index) => {
                    const userSelection = node.selectedId; 
                    const isLatest = index === history.length - 1;

                    return (
                        <div key={index} className="retro-card animate-fade-in">
                            {/* 章节标题：居中 */}
                            {node.title && (
                                <h3 className="retro-chapter-title">
                                    {node.title}
                                </h3>
                            )}
                            
                            {/* Meta信息 */}
                            <div className="retro-meta">
                                <span>SEQ: {node.step || index + 1}</span>
                                <span>STATUS: {node.stage || 'ACTIVE'}</span>
                            </div>

                            {/* 故事正文：左对齐 */}
                            <p className="retro-text">
                                {node.narrative}
                            </p>

                            {/* 选项区域 */}
                            {!userSelection ? (
                                // 如果有选项且长度大于0
                                node.choices && node.choices.length > 0 ? (
                                    <div className="retro-choices">
                                        {node.choices.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleChoice(c.id, c.shortDesc)}
                                                disabled={loading || !isLatest}
                                                className="retro-btn retro-choice-btn group"
                                            >
                                                <span className="block font-bold mb-1">[{c.id}] {c.shortDesc}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    // 没选项了（结局前奏），等待 Modal 弹出
                                    <div className="text-center py-4 text-sm animate-pulse">
                                        ... END OF TRANSMISSION ...
                                    </div>
                                )
                            ) : (
                                // 已选结果
                                <div className="retro-result mt-4">
                                    <div className="text-xs border-b border-gray-600 mb-2 pb-1">LOG ENTRY: SELECTION [{userSelection}]</div>
                                    <p>
                                        {node.choices.find(c => c.id === userSelection)?.text}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Loading 状态 */}
                {loading && (
                    <div className="text-center py-6 animate-pulse">
                        <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
                        PROCESSING DATA STREAM...
                    </div>
                )}
                
                <div ref={bottomRef} />
            </div>

            {/* Grand Title Modal - 结局大标题 */}
            {history.length > 0 && history[history.length - 1]?.grandTitle && (
                <div className="retro-modal-overlay">
                    <div className="retro-modal-content animate-fade-in">
                        <h2 className="text-sm tracking-widest mb-4 border-b border-green-500 pb-2 inline-block">MYTHOS COMPLETE</h2>
                        
                        {/* 大标题 */}
                        <h1 className="retro-grand-title">
                            {history[history.length - 1].grandTitle}
                        </h1>
                        
                        <p className="retro-text text-center italic mb-8 px-8">
                            {history[history.length - 1].narrative}
                        </p>
                        
                        <button 
                            onClick={() => window.location.reload()} 
                            className="retro-btn px-10 py-4 text-xl"
                        >
                            INITIATE NEW CYCLE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}