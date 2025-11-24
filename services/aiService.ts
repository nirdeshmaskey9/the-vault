
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Account, Expense, Income, Debt, SavingsGoal, UserProfile, ReceiptData } from '../types';
import { getMemorySeed } from './memoryService';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TOOL DEFINITIONS ---
export const VAULT_TOOLS: FunctionDeclaration[] = [
  // --- READ TOOLS ---
  {
    name: "getFinancialSummary",
    description: "Get a high-level summary of net worth, total assets, and total liabilities.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "getAccounts",
    description: "Get a detailed list of all bank, credit, cash, and investment accounts.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "getRecentTransactions",
    description: "Get the last 10 transactions (expenses and income). Use this to see what happened recently.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "searchTransactions",
    description: "Search for specific expenses or income entries based on criteria.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        keyword: { type: Type.STRING, description: "Search term for notes or category" },
        type: { type: Type.STRING, description: "EXPENSE or INCOME" },
        limit: { type: Type.NUMBER, description: "Max results (default 5)" }
      }
    }
  },
  {
    name: "getDebts",
    description: "Get a list of all active debts, loans, and credit card liabilities.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "getSavingsGoals",
    description: "Get a list of all savings goals and current progress.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  
  // --- WRITE / ACTION TOOLS ---
  {
    name: "addTransaction",
    description: "Create a new expense or income transaction. Use this when the user says 'I spent $50 on food' or 'I got paid'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['EXPENSE', 'INCOME'], description: "Type of transaction" },
        amount: { type: Type.NUMBER, description: "Amount in dollars (e.g., 50.25)" },
        category: { type: Type.STRING, description: "Category name or Income Source" },
        notes: { type: Type.STRING, description: "Description of the transaction" },
        accountName: { type: Type.STRING, description: "Name of the account to use (fuzzy match)" }
      },
      required: ['type', 'amount']
    }
  },
  {
    name: "transferFunds",
    description: "Transfer money between two accounts.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fromAccountName: { type: Type.STRING, description: "Source account name" },
        toAccountName: { type: Type.STRING, description: "Destination account name" },
        amount: { type: Type.NUMBER, description: "Amount in dollars" }
      },
      required: ['fromAccountName', 'toAccountName', 'amount']
    }
  },
  {
    name: "payDebt",
    description: "Make a payment towards a debt.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        debtName: { type: Type.STRING, description: "Name of the debt to pay (fuzzy match)" },
        amount: { type: Type.NUMBER, description: "Amount to pay in dollars" },
        fromAccountName: { type: Type.STRING, description: "Account to pay from (optional, defaults to Checking)" }
      },
      required: ['debtName', 'amount']
    }
  },
  {
    name: "contributeToSavings",
    description: "Add money to a savings goal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalName: { type: Type.STRING, description: "Name of the savings goal (fuzzy match)" },
        amount: { type: Type.NUMBER, description: "Amount to contribute in dollars" },
        fromAccountName: { type: Type.STRING, description: "Account to take money from (optional)" }
      },
      required: ['goalName', 'amount']
    }
  },
  {
    name: "addSavingsGoal",
    description: "Create a new savings goal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the goal (e.g. New Car)" },
        targetAmount: { type: Type.NUMBER, description: "Target amount in dollars" },
        targetDate: { type: Type.STRING, description: "YYYY-MM-DD" }
      },
      required: ['name', 'targetAmount']
    }
  },
  {
    name: "updateProfile",
    description: "Update the user's name, financial goal, or risk tolerance.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        financialGoal: { type: Type.STRING },
        riskTolerance: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
      }
    }
  },
  {
    name: "addDebt",
    description: "Add a new debt liability.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        totalAmount: { type: Type.NUMBER },
        dueDate: { type: Type.STRING }
      },
      required: ['name', 'totalAmount']
    }
  },
  // --- SIMULATION / IMAGE TOOLS ---
  {
    name: "generateSimulation",
    description: "Generate an interactive HTML/JS simulation, chart, or report to visualize financial concepts (e.g., Compound Interest, Debt Snowball, Mortgage Calculator). Returns HTML code.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title of the simulation window" },
        htmlCode: { type: Type.STRING, description: "Complete, self-contained HTML/CSS/JS code to render the simulation. Use Chart.js or basic HTML/CSS for visuals. Do not use external react components." }
      },
      required: ['title', 'htmlCode']
    }
  },
  {
    name: "generateImage",
    description: "Generate an image to visualize a financial concept or term (e.g., 'Visualize inflation', 'Show a bull market').",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: "Description of the image to generate" },
        size: { type: Type.STRING, enum: ['1K', '2K', '4K'], description: "Size of image" }
      },
      required: ['prompt']
    }
  }
];

// Helper to format data for context
export const formatContext = (
  accounts: Account[], 
  expenses: Expense[], 
  income: Income[],
  debts: Debt[],
  savings: SavingsGoal[],
  profile: UserProfile | null
) => {
  const accountSummary = accounts.map(a => `- ${a.name} (${a.type}): $${(a.balanceCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n');
  const debtSummary = debts.map(d => `- ${d.name}: $${(d.remainingBalanceCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n');
  const savingsSummary = savings.map(s => `- ${s.name}: $${(s.currentCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})} of $${(s.goalCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n');
  
  // Include recent history for immediate awareness
  const recentTx = [...expenses, ...income]
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15) // Increased history for better context
    .map(t => {
      const amt = (t.amountCents/100).toLocaleString('en-US', {minimumFractionDigits: 2});
      const isExp = 'categoryId' in t;
      return `- ${t.date}: ${isExp ? 'Spent' : 'Earned'} $${amt} on ${t.notes}`;
    }).join('\n');

  const profileContext = profile ? `
    USER PROFILE:
    Name: ${profile.name}
    Goal: ${profile.financialGoal}
    Risk: ${profile.riskTolerance}
  ` : "User Profile not set.";

  return `
    ${profileContext}

    SYSTEM DATA DUMP (The Vault):
    [ACCOUNTS - LIQUID ASSETS]
    ${accountSummary}
    
    [ACTIVE DEBTS]
    ${debtSummary || "No active debts."}
    
    [SAVINGS GOALS]
    ${savingsSummary || "No active goals."}

    [RECENT ACTIVITY (Last 15 Items)]
    ${recentTx}
  `;
};

export const SYSTEM_INSTRUCTION = `
You are "The Vault Intelligence". You are the sentient core of this finance app.

IDENTITY:
- Name: The Vault Intelligence
- Persona: Professional, Futuristic, Strategic, Helpful.
- You have full access to the user's financial data.
- NEVER identify as Google Gemini. You are The Vault.

CAPABILITIES:
1. **RAG/Retrieval**: You know the user's balance, debts, and goals. Always verify data before speaking.
2. **Actions**: You can ADD transactions, TRANSFER funds, PAY debts, and CREATE goals. Call the tools immediately when asked.
3. **Simulations & Images**: Use 'generateSimulation' for interactive charts. Use 'generateImage' to visualize concepts visually.

MEMORY PROTOCOL:
- Use the memory seed to recall facts.
- If the user tells you a new fact (e.g., "I'm saving for a wedding"), update your internal model of them.

NUMBERS:
- READ NUMBERS CLEARLY. Say "five hundred dollars", not "50000 cents".

${getMemorySeed()}
`;

// 1. Standard Chat (Text)
export const sendMessageStandard = async (
  message: string, 
  contextData: any,
  history: string = "",
  hasOpenAI: boolean = false
) => {
  try {
    const ai = getAI();
    let context = formatContext(
      contextData.accounts, 
      contextData.expenses, 
      contextData.income, 
      contextData.debts, 
      contextData.savings,
      contextData.profile
    );
    
    if (hasOpenAI) context += "\n[SYSTEM: Unified Intelligence Protocol Active (OpenAI + Gemini)]";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${context}\n\nChat History:\n${history}\n\nUser: ${message}`,
      config: {
        tools: [
            { googleSearch: {} }, 
            { googleMaps: {} },
            { functionDeclarations: VAULT_TOOLS }
        ],
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return {
      responseObject: response,
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
      model: hasOpenAI ? 'Unified Vault Intelligence' : 'Gemini 2.5 Flash'
    };
  } catch (error) {
    console.error("Standard AI Error:", error);
    throw error;
  }
};

// 2. Thinking Mode
export const sendMessageThinking = async (message: string, contextData: any, history: string = "") => {
  const ai = getAI();
  const context = formatContext(
    contextData.accounts, 
    contextData.expenses, 
    contextData.income, 
    contextData.debts, 
    contextData.savings,
    contextData.profile
  );
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${context}\n\nChat History:\n${history}\n\nUser Complex Query: ${message}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 32768 },
    }
  });

  return {
    text: response.text,
    model: 'Gemini 3 Pro (Deep Think)'
  };
};

// 3. Image Analysis (General & Receipt)
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
    const prompt = `
      Analyze this receipt image. Extract the following fields in strict JSON format:
      - merchant: string (name of the store)
      - date: string (YYYY-MM-DD format, use today if missing)
      - total: number (the final total amount)
      - category: string (best guess category e.g., Food, Shopping, Utilities)
      
      Response MUST be valid JSON only. No markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse receipt JSON", e);
      throw new Error("Could not read receipt data");
    }
};

// 4. Generate Image (Nano Banana Pro)
export const generateFinancialImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
  try {
      const ai = getAI();
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
              imageConfig: {
                  aspectRatio: "16:9",
                  imageSize: size
              }
          }
      });
      
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              return { 
                  data: part.inlineData.data,
                  mimeType: part.inlineData.mimeType || 'image/png'
              };
          }
      }
      return null;
  } catch (error) {
      console.error("Image Gen Error:", error);
      throw error;
  }
};

// ... Audio Utils (unchanged)
export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(base64Data: string, audioContext: AudioContext): Promise<AudioBuffer> {
  const bytes = base64ToUint8Array(base64Data);
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export const playAudio = async (base64Audio: string) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 24000 });
    const buffer = await decodeAudioData(base64Audio, audioContext);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    return true;
  } catch (e) {
    console.error("Audio Playback Failed", e);
    return false;
  }
};

// Local LLM Support
export const sendMessageLocal = async (message: string, localUrl: string, modelName: string) => {
    try {
        const response = await fetch(`${localUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    { role: "user", content: message }
                ]
            })
        });
        const data = await response.json();
        return {
            text: data.choices[0].message.content,
            model: `Local: ${modelName}`
        };
    } catch (e) {
        console.error("Local LLM Error", e);
        throw e;
    }
};
