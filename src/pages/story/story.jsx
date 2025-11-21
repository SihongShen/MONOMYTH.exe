import React, { useState, useRef, useEffect} from 'react';
// get prompt instructions
import { SYSTEM_INSTRUCTION, MAX_STEPS } from '../../constants.js';
import { GoogleGenAI } from "@google/genai";

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
            // TODO: Replace this with your actual API call to Google GenAI
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

        const currentStepIndex = history.length - 1;
        const newHistory = [...history];

        newHistory[currentStepIndex].selectedId = choiceId;
        setHistory(newHistory);

        setLoading(true);

        try {
            const nextStep = history.length + 1;
            const isLastStep = nextStep === MAX_STEPS;

            const prompt = `
                User choice: ${choiceId} (${shortDesc}).
              
                MISSION: Generate **Step ${nextStep}** of ${MAX_STEPS}.
                ${isLastStep ? "**IMPORTANT: This is the FINAL STEP (Conclusion). Bring the story to a close.**" : "Keep the narrative going, do NOT end the story yet."}
            `;

            const response = await chatSession.sendMessage({
                message: prompt
            });

            const nextNode = parseAndValidate(response.text);

            nextNode.step = nextStep;

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
    <div className="p-10 bg-gray-100 min-h-screen font-mono text-gray-800 pb-20">
      <h1 className="text-2xl font-bold mb-6">Monomyth Test Lab</h1>

      {/* 输入框 (只在没开始时显示，或者一直显示也可以) */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <div className="flex gap-4">
          <input 
            type="text" 
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Enter SEED..."
            className="border border-gray-300 p-2 flex-1 rounded"
            // 如果已经开始了，禁止修改
            disabled={history.length > 0} 
          />
          <button 
            onClick={handleStartGame}
            disabled={loading || history.length > 0}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
          >
            {history.length > 0 ? 'Running...' : 'Start Journey'}
          </button>
        </div>
        {/* 重置按钮 */}
        {history.length > 0 && (
            <button onClick={() => window.location.reload()} className="text-xs text-red-500 mt-2 underline">
                Reset System
            </button>
        )}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded">{error}</div>}

      {/* 🔴【改动 4】列表渲染核心区域 */}
      <div className="space-y-8 max-w-3xl mx-auto">
        {history.map((node, index) => {
          // 这一步用户是否已经选过了？
          const userSelection = node.selectedId; 
          // 这是不是当前最新的步骤？
          const isLatest = index === history.length - 1;

          return (
            <div key={index} className="bg-white p-6 rounded shadow-lg border-l-4 border-green-500 animate-fade-in">
              
              {/* 标题 */}
              <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase font-bold">
                <span>Step {node.step || index + 1}</span>
                <span>{node.stage || 'NARRATIVE'}</span>
              </div>

              {/* 故事正文 */}
              <p className="text-lg leading-relaxed mb-4 text-gray-800">
                {node.narrative}
              </p>

              {/* 选项区域逻辑： */}
              {/* 1. 如果没选过 -> 显示按钮 */}
              {!userSelection ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                   {node.choices?.map(c => (
                     <button
                       key={c.id}
                       // 点击触发 handleChoice
                       onClick={() => handleChoice(c.id, c.shortDesc)}
                       disabled={loading || !isLatest} // 只能操作最后一步
                       className="border-2 border-blue-100 p-4 hover:bg-blue-50 hover:border-blue-500 transition-all text-left rounded group"
                     >
                       <div className="font-bold text-blue-600 group-hover:text-blue-800">
                         [{c.id}] {c.shortDesc}
                       </div>
                     </button>
                   ))}
                </div>
              ) : (
                // 2. 如果选过了 -> 显示结果 Text
                <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
                   <div className="text-xs text-gray-500 uppercase mb-1">
                     You Chose: {userSelection}
                   </div>
                   <p className="text-green-700 italic font-serif">
                     {/* 找到用户选的那个选项的 text 字段 */}
                     {node.choices.find(c => c.id === userSelection)?.text}
                   </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading 状态 */}
        {loading && (
            <div className="text-center text-gray-500 animate-pulse py-4">
                ⚡ AI is generating next step...
            </div>
        )}
        
        {/* 自动滚动锚点 */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}