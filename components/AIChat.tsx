
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Account, Expense, Income, ChatMessage, Debt, SavingsGoal, UserStats, UserProfile, ReceiptData, AIState, ModalType, Artifact } from '../types';
import { 
  sendMessageStandard, 
  sendMessageThinking, 
  analyzeFinancialImage, 
  extractReceiptData,
  decodeAudioData,
  arrayBufferToBase64,
  generateFinancialImage,
  VAULT_TOOLS,
  SYSTEM_INSTRUCTION,
  formatContext 
} from '../services/aiService';
import { ThreeScene } from './ThreeScene';
import { Modal } from './UIComponents';

interface AIChatProps {
  accounts: Account[];
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  savings: SavingsGoal[];
  stats: UserStats;
  profile: UserProfile | null;
  onExecuteAction: (action: string, params: any) => Promise<any>;
  onReceiptScanned: (data: ReceiptData) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ accounts, expenses, income, debts, savings, stats, profile, onExecuteAction, onReceiptScanned }) => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<'standard' | 'thinking' | 'live'>('standard');
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  
  // Logic State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'I am The Vault Intelligence. How can I assist you today?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiState, setAiState] = useState<AIState>('idle');
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
  
  // Live API State
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, loading]);

  // --- ARTIFACT RENDERING ---
  const handleArtifact = (title: string, content: string, type: 'html' | 'image') => {
    setArtifact({
        id: Date.now().toString(),
        title,
        type,
        content,
        isVisible: true
    });
  };

  // --- MESSAGE SENDING ---
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      attachment: attachment ? { type: 'image', data: attachment.data, mimeType: attachment.mimeType } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    setLoading(true);
    setAiState(mode === 'thinking' ? 'thinking' : 'speaking');

    try {
      let responseText = "";
      let modelUsed = "";
      const contextData = { accounts, expenses, income, debts, savings, profile };
      const historyText = messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');

      if (userMsg.attachment) {
        const result = await analyzeFinancialImage(userMsg.attachment.data, userMsg.attachment.mimeType, userMsg.text);
        responseText = result.text;
        modelUsed = result.model;
      } else if (mode === 'thinking') {
        const result = await sendMessageThinking(userMsg.text, contextData, historyText);
        responseText = result.text;
        modelUsed = result.model;
      } else {
        const result = await sendMessageStandard(userMsg.text, contextData, historyText, false);
        
        // Check for Tool Calls (Actions or Artifacts)
        if (result.responseObject?.functionCalls && result.responseObject.functionCalls.length > 0) {
          const call = result.responseObject.functionCalls[0];
          
          if (call.name === 'generateSimulation') {
             handleArtifact(call.args.title as string, call.args.htmlCode as string, 'html');
             responseText = `I've generated a simulation: ${call.args.title}. Check the window.`;
          } else if (call.name === 'generateImage') {
             const img = await generateFinancialImage(call.args.prompt as string, call.args.size as any);
             if (img) {
               handleArtifact(call.args.prompt as string, `data:${img.mimeType};base64,${img.data}`, 'image');
               responseText = `Here is the visualization for: ${call.args.prompt}`;
             } else {
               responseText = "Failed to generate image.";
             }
          } else {
             try {
                const actionResult = await onExecuteAction(call.name, call.args);
                responseText = `✅ Executed ${call.name}. ${JSON.stringify(actionResult)}`;
             } catch (err) {
                responseText = `❌ Failed to execute ${call.name}: ${String(err)}`;
             }
          }
        } else {
          responseText = result.text;
        }
        modelUsed = result.model;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
        modelUsed
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error processing request.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
      setAiState('idle');
    }
  };

  // --- LIVE VOICE HANDLER ---
  const toggleLiveSession = async () => {
    if (isLiveConnected) {
      window.location.reload(); 
      return;
    }

    try {
      setIsLiveConnected(true);
      setMode('live');
      setAiState('listening');
      setIsOpen(false); 
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      const outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      // GENERATE DYNAMIC SYSTEM INSTRUCTION WITH CONTEXT
      const contextData = { accounts, expenses, income, debts, savings, profile };
      const liveContext = formatContext(
        contextData.accounts,
        contextData.expenses,
        contextData.income,
        contextData.debts,
        contextData.savings,
        contextData.profile
      );
      
      const fullSystemInstruction = `${SYSTEM_INSTRUCTION}\n\nCURRENT LIVE DATA CONTEXT:\n${liveContext}\n\nIMPORTANT: Use the tools available to you to fetch more specific data if needed, but you already have the summary above.`;

      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            setAiState('listening');

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isLiveConnected) return; // Stop processing if disconnected
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = arrayBufferToBase64(new Int16Array(inputData.map(s => s * 32768)).buffer);
              sessionPromise.then(session => session.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: pcmData } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              setAiState('thinking');
              const responses = [];
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'generateSimulation') {
                    handleArtifact(fc.args.title as string, fc.args.htmlCode as string, 'html');
                    responses.push({ id: fc.id, name: fc.name, response: { result: "Simulation Rendered on User Screen" } });
                } else if (fc.name === 'generateImage') {
                    const img = await generateFinancialImage(fc.args.prompt as string, fc.args.size as any);
                    if (img) {
                      handleArtifact(fc.args.prompt as string, `data:${img.mimeType};base64,${img.data}`, 'image');
                      responses.push({ id: fc.id, name: fc.name, response: { result: "Image Generated and Displayed to User" } });
                    } else {
                      responses.push({ id: fc.id, name: fc.name, response: { result: "Failed to generate image" } });
                    }
                } else {
                    let result = {};
                    try { result = await onExecuteAction(fc.name, fc.args); } catch (e) { result = { error: "Failed" }; }
                    responses.push({ id: fc.id, name: fc.name, response: { result } });
                }
              }
              sessionPromise.then(session => session.sendToolResponse({ functionResponses: responses }));
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setAiState('speaking');
              const buffer = await decodeAudioData(base64Audio as string, outputAudioContext);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              
              const now = outputAudioContext.currentTime;
              nextStartTime = Math.max(nextStartTime, now);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
              sources.add(source);
              source.onended = () => { sources.delete(source); if (sources.size === 0) setAiState('listening'); };
            }
          },
          onclose: () => { 
            console.log("Session Closed");
            setIsLiveConnected(false); 
            setMode('standard'); 
            setAiState('idle'); 
          },
          onerror: (err) => { 
            console.error("Live API Error:", err); 
            setIsLiveConnected(false); 
          }
        },
        config: {
          systemInstruction: fullSystemInstruction, // INJECTED IDENTITY AND CONTEXT
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: VAULT_TOOLS }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      liveSessionRef.current = sessionPromise;
    } catch (e) {
      console.error(e);
      setIsLiveConnected(false);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
              const data = await extractReceiptData(base64, file.type);
              onReceiptScanned(data);
              setMessages(p => [...p, { id: Date.now().toString(), role: 'model', text: `Scanned receipt from ${data.merchant} for $${data.total}.`, timestamp: Date.now() }]);
          } catch (e) { console.error(e); }
      };
      reader.readAsDataURL(file);
  };

  return (
    <>
      {/* 3D Background & Focus Mode */}
      <ThreeScene aiState={aiState} focusMode={isLiveConnected} />

      {/* --- LIVE VOICE HUD --- */}
      {isLiveConnected && (
        <div className="fixed inset-x-0 bottom-0 p-8 flex flex-col items-center justify-end z-50 pointer-events-none">
          {/* HUD CONTROLS */}
          <div className="pointer-events-auto flex gap-4 mb-4">
             <button onClick={() => setIsOpen(!isOpen)} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-xs hover:bg-white/20">
               {isOpen ? "Hide Chat" : "Show Chat / Images"}
             </button>
             <button onClick={() => window.location.reload()} className="bg-red-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/30 text-red-200 text-xs hover:bg-red-500/40">
               End Session
             </button>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-6 pointer-events-auto animate-[slideUp_0.3s_ease-out]">
             <div className="flex flex-col items-center">
                <span className={`text-xs font-bold tracking-widest ${aiState === 'listening' ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                   {aiState.toUpperCase()}
                </span>
                <span className="text-white font-mono text-sm mt-1">VAULT CORE ACTIVE</span>
             </div>
             
             {/* Visualizer bars */}
             <div className="flex gap-1 h-8 items-center">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1 bg-white rounded-full transition-all duration-100 ${aiState === 'speaking' ? `h-${Math.floor(Math.random()*8)} animate-pulse` : 'h-2 opacity-30'}`}></div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* --- STANDARD CHAT TOGGLE BUTTON (Only if not Live, or handled by HUD) --- */}
      {!isLiveConnected && (
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-rose-500 rotate-45' : 'bg-violet-600 animate-pulse'}`}
        >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        </button>
      )}

      {/* --- SIDE PANEL CHAT --- */}
      <div className={`fixed bottom-24 right-6 w-[90vw] md:w-[400px] bg-black/80 backdrop-blur-xl border border-violet-500/30 rounded-2xl shadow-2xl z-40 transition-all duration-300 flex flex-col overflow-hidden ${isOpen ? 'opacity-100 translate-y-0 h-[600px]' : 'opacity-0 translate-y-10 pointer-events-none h-0'}`}>
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border-b border-white/10 flex justify-between items-center">
                <span className="font-bold text-white text-sm neon-text">VAULT INTELLIGENCE</span>
                <div className="flex gap-2">
                    <input type="file" ref={receiptInputRef} onChange={handleReceiptUpload} accept="image/*" className="hidden" />
                    <button onClick={() => receiptInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300" title="Scan Receipt">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    </button>
                    {!isLiveConnected && (
                        <button onClick={toggleLiveSession} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300" title="Voice Mode">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>
                    )}
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-violet-600/80 text-white rounded-br-none' : 'bg-slate-800/80 text-gray-200 rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-xs text-violet-400 animate-pulse ml-2">Thinking...</div>}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-black/40 border-t border-white/10 flex gap-2">
                <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder="Ask The Vault..." 
                    disabled={isLiveConnected}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />
                <button type="submit" disabled={loading || isLiveConnected} className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 disabled:opacity-50">
                    <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
      </div>

      {/* --- ARTIFACT WINDOW (SIMULATION / IMAGE) --- */}
      <Modal isOpen={!!artifact?.isVisible} onClose={() => setArtifact(null)} title={artifact?.title || "Artifact"}>
          <div className="w-full h-[60vh] bg-white rounded-lg overflow-hidden flex items-center justify-center bg-gray-900">
             {artifact?.type === 'html' ? (
                 <iframe 
                    srcDoc={artifact.content} 
                    className="w-full h-full border-none"
                    title="Simulation Artifact"
                    sandbox="allow-scripts"
                 />
             ) : (
                <img src={artifact?.content} alt="Generated" className="max-w-full max-h-full object-contain" />
             )}
          </div>
          <div className="mt-4 flex justify-end">
              <button onClick={() => setArtifact(null)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Close Window</button>
          </div>
      </Modal>
    </>
  );
};
