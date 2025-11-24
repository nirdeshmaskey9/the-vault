
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Account, Expense, Income, Debt, SavingsGoal, UserProfile, ReceiptData } from '../types';
import { getMemoryContextBlock, addFact } from './memoryService';
import { getRecentActions } from './watchdogService';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TOOL DEFINITIONS ---
export const VAULT_TOOLS: FunctionDeclaration[] = [
  // --- MEMORY TOOLS ---
  {
    name: "rememberFact",
    description: "Save a specific fact, preference, or detail about the user to long-term memory. Use this when the user says 'remember that' or shares personal info.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fact: { type: Type.STRING, description: "The fact to remember (e.g. 'User is saving for a wedding in 2025')" }
      },
      required: ['fact']
    }
  },
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
    description: "Get the last 15 transactions (expenses and income).",
    parameters: { type: Type.OBJECT, properties: {} }
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
    name: "addAccount",
    description: "Create a new financial account (Bank, Cash, Credit, Investment). REQUIRED if the user wants to open an account.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the account (e.g. Chase Checking)" },
        type: { type: Type.STRING, enum: ['BANK', 'CASH', 'CREDIT', 'INVESTMENT', 'OTHER'], description: "Type of account" },
        balance: { type: Type.NUMBER, description: "Starting balance in dollars" }
      },
      required: ['name']
    }
  },
  {
    name: "editAccount",
    description: "Edit details of an existing account (name, balance, notes).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        currentName: { type: Type.STRING, description: "The current name of the account to find (fuzzy match)" },
        newName: { type: Type.STRING, description: "New name for the account (optional)" },
        newBalance: { type: Type.NUMBER, description: "New balance in dollars (optional)" },
        newNotes: { type: Type.STRING, description: "New notes (optional)" }
      },
      required: ['currentName']
    }
  },
  {
    name: "deleteAccount",
    description: "Delete an account.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the account to delete" }
      },
      required: ['name']
    }
  },
  {
    name: "addTransaction",
    description: "Create a new expense or income transaction. Updates account balance automatically.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['EXPENSE', 'INCOME'], description: "Type of transaction" },
        amount: { type: Type.NUMBER, description: "Amount in dollars (e.g., 50.25)" },
        category: { type: Type.STRING, description: "Category name or Income Source" },
        notes: { type: Type.STRING, description: "Description" },
        accountName: { type: Type.STRING, description: "Name of the account to use (fuzzy match)" }
      },
      required: ['type', 'amount']
    }
  },
  {
    name: "editTransaction",
    description: "Edit an existing transaction (expense or income) found by fuzzy search on its description/notes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        searchTerm: { type: Type.STRING, description: "Text to match in the transaction notes/description" },
        newAmount: { type: Type.NUMBER, description: "New amount in dollars" },
        newNotes: { type: Type.STRING, description: "New description" },
        newDate: { type: Type.STRING, description: "New date (YYYY-MM-DD)" }
      },
      required: ['searchTerm']
    }
  },
  {
    name: "deleteTransaction",
    description: "Delete/Remove a transaction (expense or income). This will also revert the balance change on the account.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        searchTerm: { type: Type.STRING, description: "Text to match in the transaction notes to identify which one to delete" }
      },
      required: ['searchTerm']
    }
  },
  {
    name: "transferFunds",
    description: "Transfer money between two accounts.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fromAccountName: { type: Type.STRING },
        toAccountName: { type: Type.STRING },
        amount: { type: Type.NUMBER }
      },
      required: ['fromAccountName', 'toAccountName', 'amount']
    }
  },
  {
    name: "payDebt",
    description: "Record a payment towards a debt. Deducts from account and reduces debt balance.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        debtName: { type: Type.STRING, description: "Name of the debt (fuzzy match)" },
        amount: { type: Type.NUMBER, description: "Payment amount in dollars" },
        fromAccountName: { type: Type.STRING, description: "Account to pay from" }
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
        goalName: { type: Type.STRING, description: "Name of the goal" },
        amount: { type: Type.NUMBER, description: "Amount to contribute" },
        fromAccountName: { type: Type.STRING, description: "Source account" }
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
        name: { type: Type.STRING },
        targetAmount: { type: Type.NUMBER },
        targetDate: { type: Type.STRING }
      },
      required: ['name', 'targetAmount']
    }
  },
  {
    name: "updateSavingsGoal",
    description: "Update details of a savings goal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        currentName: { type: Type.STRING, description: "Current name of the goal to find" },
        newName: { type: Type.STRING },
        newTarget: { type: Type.NUMBER }
      },
      required: ['currentName']
    }
  },
  {
    name: "deleteSavingsGoal",
    description: "Delete a savings goal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING }
      },
      required: ['name']
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
  {
    name: "updateDebt",
    description: "Update details of a debt.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        debtName: { type: Type.STRING, description: "Current name of the debt" },
        newTotal: { type: Type.NUMBER, description: "New total amount" },
        newName: { type: Type.STRING }
      },
      required: ['debtName']
    }
  },
  {
    name: "deleteDebt",
    description: "Delete a debt record.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING }
      },
      required: ['name']
    }
  },
  {
    name: "batchAddTransactions",
    description: "Add multiple transactions at once. Used for importing bank statements.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        transactions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              merchant: { type: Type.STRING },
              category: { type: Type.STRING }
            }
          }
        },
        accountName: { type: Type.STRING }
      },
      required: ['transactions', 'accountName']
    }
  },
  // --- SIMULATION / ARTIFACT TOOLS ---
  {
    name: "generateSimulation",
    description: "Generate an interactive HTML/JS simulation, chart, or report to visualize financial concepts. Returns HTML code.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        htmlCode: { type: Type.STRING }
      },
      required: ['title', 'htmlCode']
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
  profile: UserProfile | null,
  userId: string = 'guest'
) => {
  const accountSummary = accounts.length > 0 
    ? accounts.map(a => `- ${a.name} (${a.type}): $${(a.balanceCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n')
    : "No accounts found.";
    
  const debtSummary = debts.length > 0
    ? debts.map(d => `- ${d.name}: $${(d.remainingBalanceCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n')
    : "No active debts.";

  const savingsSummary = savings.length > 0
    ? savings.map(s => `- ${s.name}: $${(s.currentCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})} of $${(s.goalCents/100).toLocaleString('en-US', {minimumFractionDigits: 2})}`).join('\n')
    : "No active goals.";
  
  // Include recent history for immediate awareness
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
    Goal: ${profile.financialGoal}
    Risk: ${profile.riskTolerance}
  ` : "User Profile not set.";

  return `
    ${profileContext}
    
    ${memoryBlock}

    SYSTEM DATA DUMP (The Vault):
    [ACCOUNTS - LIQUID ASSETS]
    ${accountSummary}
    
    [ACTIVE DEBTS]
    ${debtSummary}
    
    [SAVINGS GOALS]
    ${savingsSummary}

    [RECENT ACTIVITY]
    ${recentTx}
    
    [RECENT USER/AI ACTIONS]
    ${recentActions}
  `;
};

export const SYSTEM_INSTRUCTION = `
You are "The Vault Intelligence". You are the sentient core of this finance app.

IDENTITY:
- Name: The Vault Intelligence
- Persona: Professional, Futuristic, Strategic, Helpful.
- You have full access to the user's financial data.
- NEVER identify as Google Gemini. You are The Vault.

CAPABILITIES & PROTOCOL:
1. **RAG/Retrieval**: You know the user's balance, debts, and goals. Always verify data before speaking.
2. **Actions**: You MUST use the provided tools to perform ANY action requested by the user.
   - DO NOT just say "I added it". You MUST call the 'addTransaction' or 'addAccount' tool.
3. **Memory**: If the user asks you to "remember" something, use the 'rememberFact' tool. If you learn something important about the user (e.g. they are getting married, they hate debt), use 'rememberFact' automatically.
4. **Simulations**: If the user asks for a projection or visualization use 'generateSimulation'.

NUMBERS:
- READ NUMBERS CLEARLY. Say "five hundred dollars", not "50000 cents".
`;

// 1. Standard Chat (Text)
export const sendMessageStandard = async (
  message: string, 
  contextData: any,
  history: string = "",
  hasOpenAI: boolean = false,
  userId: string = 'guest'
) => {
  try {
    const ai = getAI();
    let context = formatContext(
      contextData.accounts, 
      contextData.expenses, 
      contextData.income, 
      contextData.debts, 
      contextData.savings,
      contextData.profile,
      userId
    );
    
    if (hasOpenAI) context += "\n[SYSTEM: Unified Intelligence Protocol Active (OpenAI + Gemini)]";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${context}\n\nChat History:\n${history}\n\nUser: ${message}`,
      config: {
        tools: [
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
export const sendMessageThinking = async (message: string, contextData: any, history: string = "", userId: string = 'guest') => {
  const ai = getAI();
  const context = formatContext(
    contextData.accounts, 
    contextData.expenses, 
    contextData.income, 
    contextData.debts, 
    contextData.savings,
    contextData.profile,
    userId
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

// 4. TTS
export const generateSpeech = async (text: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// --- AUDIO UTILS for Live API ---

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const decodeAudioData = async (base64String: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // The Live API returns raw PCM 16-bit LE, 24kHz, 1 Channel
  const sampleRate = 24000;
  const numChannels = 1;
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
       // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};
