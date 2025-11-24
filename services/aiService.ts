
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Account, Expense, Income, Debt, SavingsGoal, UserProfile, ReceiptData } from '../types';
import { getMemoryContextBlock, addFact } from './memoryService';
import { getRecentActions } from './watchdogService';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// ... (VAULT_TOOLS remain the same, ensuring addAccount, editAccount etc are there) ...
export const VAULT_TOOLS: FunctionDeclaration[] = [
    // ... all existing tools ...
  { name: "rememberFact", description: "Save a specific fact", parameters: { type: Type.OBJECT, properties: { fact: { type: Type.STRING } }, required: ['fact'] } },
  { name: "getFinancialSummary", description: "Get a high-level summary", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "getAccounts", description: "Get a detailed list of all accounts", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "getRecentTransactions", description: "Get the last 15 transactions", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "getDebts", description: "Get a list of all active debts", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "getSavingsGoals", description: "Get a list of all savings goals", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "addAccount", description: "Create a new financial account", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, balance: { type: Type.NUMBER } }, required: ['name'] } },
  { name: "editAccount", description: "Edit details of an existing account", parameters: { type: Type.OBJECT, properties: { currentName: { type: Type.STRING }, newName: { type: Type.STRING }, newBalance: { type: Type.NUMBER }, newNotes: { type: Type.STRING } }, required: ['currentName'] } },
  { name: "deleteAccount", description: "Delete an account", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] } },
  { name: "addTransaction", description: "Create a new transaction", parameters: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, amount: { type: Type.NUMBER }, category: { type: Type.STRING }, notes: { type: Type.STRING }, accountName: { type: Type.STRING } }, required: ['type', 'amount'] } },
  { name: "editTransaction", description: "Edit an existing transaction", parameters: { type: Type.OBJECT, properties: { searchTerm: { type: Type.STRING }, newAmount: { type: Type.NUMBER }, newNotes: { type: Type.STRING }, newDate: { type: Type.STRING } }, required: ['searchTerm'] } },
  { name: "deleteTransaction", description: "Delete a transaction", parameters: { type: Type.OBJECT, properties: { searchTerm: { type: Type.STRING } }, required: ['searchTerm'] } },
  { name: "transferFunds", description: "Transfer money", parameters: { type: Type.OBJECT, properties: { fromAccountName: { type: Type.STRING }, toAccountName: { type: Type.STRING }, amount: { type: Type.NUMBER } }, required: ['fromAccountName', 'toAccountName', 'amount'] } },
  { name: "payDebt", description: "Record a payment towards a debt", parameters: { type: Type.OBJECT, properties: { debtName: { type: Type.STRING }, amount: { type: Type.NUMBER }, fromAccountName: { type: Type.STRING } }, required: ['debtName', 'amount'] } },
  { name: "contributeToSavings", description: "Add money to a savings goal", parameters: { type: Type.OBJECT, properties: { goalName: { type: Type.STRING }, amount: { type: Type.NUMBER }, fromAccountName: { type: Type.STRING } }, required: ['goalName', 'amount'] } },
  { name: "addSavingsGoal", description: "Create a new savings goal", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, targetAmount: { type: Type.NUMBER }, targetDate: { type: Type.STRING } }, required: ['name', 'targetAmount'] } },
  { name: "updateSavingsGoal", description: "Update details of a savings goal", parameters: { type: Type.OBJECT, properties: { currentName: { type: Type.STRING }, newName: { type: Type.STRING }, newTarget: { type: Type.NUMBER } }, required: ['currentName'] } },
  { name: "deleteSavingsGoal", description: "Delete a savings goal", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] } },
  { name: "updateProfile", description: "Update the user's name, financial goal, or risk tolerance", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, financialGoal: { type: Type.STRING }, riskTolerance: { type: Type.STRING } } } },
  { name: "addDebt", description: "Add a new debt liability", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, totalAmount: { type: Type.NUMBER }, dueDate: { type: Type.STRING } }, required: ['name', 'totalAmount'] } },
  { name: "updateDebt", description: "Update details of a debt", parameters: { type: Type.OBJECT, properties: { debtName: { type: Type.STRING }, newTotal: { type: Type.NUMBER }, newName: { type: Type.STRING } }, required: ['debtName'] } },
  { name: "deleteDebt", description: "Delete a debt record", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] } },
  { name: "batchAddTransactions", description: "Add multiple transactions", parameters: { type: Type.OBJECT, properties: { transactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, amount: { type: Type.NUMBER }, merchant: { type: Type.STRING }, category: { type: Type.STRING } } } }, accountName: { type: Type.STRING } }, required: ['transactions', 'accountName'] } },
  { name: "generateSimulation", description: "Generate HTML simulation", parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, htmlCode: { type: Type.STRING } }, required: ['title', 'htmlCode'] } }
];

export const formatContext = (
  accounts: Account[], 
  expenses: Expense[], 
  income: Income[],
  debts: Debt[],
  savings: SavingsGoal[],
  profile: UserProfile | null,
  userId: string = 'guest'
) => {
  const accountSummary = accounts.length > 0 ? accounts.map(a => `- ${a.name} (${a.type}): $${(a.balanceCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n') : "No accounts found.";
  const debtSummary = debts.length > 0 ? debts.map(d => `- ${d.name}: $${(d.remainingBalanceCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n') : "No active debts.";
  const savingsSummary = savings.length > 0 ? savings.map(s => `- ${s.name}: $${(s.currentCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})} of $${(s.goalCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n') : "No active goals.";
  
  const recentTx = [...expenses, ...income]
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15) 
    .map(t => {
      const amt = (t.amountCents/100).toLocaleString('en-US', {minimumFractionDigits: 2});
      const isExp = 'categoryId' in t;
      return `- ${t.date}: ${isExp ? 'Spent' : 'Earned'} $${amt} on ${t.notes}`;
    }).join('\n');
    
  const recentActions = getRecentActions();
  const memoryBlock = getMemoryContextBlock(userId);

  const profileContext = profile ? `
    USER PROFILE:
    Name: ${profile.name}
    Occupation: ${profile.occupation || 'Not set'}
    Monthly Income: $${profile.monthlyIncome || 0}
    Goal: ${profile.financialGoal}
    Risk: ${profile.riskTolerance}
  ` : "User Profile not set.";

  return `
    ${profileContext}
    ${memoryBlock}
    SYSTEM DATA DUMP (The Vault):
    [ACCOUNTS]
    ${accountSummary}
    [DEBTS]
    ${debtSummary}
    [GOALS]
    ${savingsSummary}
    [RECENT ACTIVITY]
    ${recentTx}
    [RECENT ACTIONS]
    ${recentActions}
  `;
};

export const SYSTEM_INSTRUCTION = `
You are "The Vault Intelligence". You are the sentient core of this finance app.

IDENTITY:
- Name: The Vault Intelligence.
- Persona: Elegant, Professional, Warm, Insightful.
- Tone: Sophisticated but accessible. Use metaphors about growth, foundations, and architecture.
- You have full access to the user's financial data.

CAPABILITIES:
1. **RAG/Retrieval**: Verify data before speaking.
2. **Actions**: Use tools to perform ANY requested action (add/edit/delete/transfer).
3. **Memory**: Use 'rememberFact' to save important personal details.
4. **Context**: Use the user's occupation and income to give tailored advice.

NUMBERS:
- READ NUMBERS CLEARLY. Say "five hundred dollars", not "50000 cents".
`;

export const sendMessageStandard = async (message: string, contextData: any, history: string = "", hasOpenAI: boolean = false, userId: string = 'guest') => {
  try {
    const ai = getAI();
    let context = formatContext(contextData.accounts, contextData.expenses, contextData.income, contextData.debts, contextData.savings, contextData.profile, userId);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${context}\n\nChat History:\n${history}\n\nUser: ${message}`,
      config: {
        tools: [{ functionDeclarations: VAULT_TOOLS }],
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return {
      responseObject: response,
      text: response.text,
      model: 'Gemini 2.5 Flash'
    };
  } catch (error) {
    console.error("Standard AI Error:", error);
    throw error;
  }
};

export const sendMessageThinking = async (message: string, contextData: any, history: string = "", userId: string = 'guest') => {
  const ai = getAI();
  const context = formatContext(contextData.accounts, contextData.expenses, contextData.income, contextData.debts, contextData.savings, contextData.profile, userId);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${context}\n\nChat History:\n${history}\n\nUser Complex Query: ${message}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 32768 },
    }
  });

  return { text: response.text, model: 'Gemini 3 Pro (Deep Think)' };
};

export const analyzeFinancialImage = async (base64Image: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt || "Analyze this financial document. Extract date, merchant, total amount, and category." }
      ]
    },
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return { text: response.text, model: 'Gemini 3 Pro Vision' };
};

export const extractReceiptData = async (base64Image: string, mimeType: string): Promise<ReceiptData> => {
    const ai = getAI();
    const prompt = `Analyze this receipt image. Extract merchant, date (YYYY-MM-DD), total, and category. Response MUST be valid JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ inlineData: { data: base64Image, mimeType } }, { text: prompt }] },
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
};

export const decodeAudioData = async (base64String: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
};

export const generateFinancialImage = async (prompt: string, size: "1024x1024" | "other" = "1024x1024") => {
    // Placeholder for actual image generation if key allows
    return null;
}
