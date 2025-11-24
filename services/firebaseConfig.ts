
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- INSTRUCTIONS ---
// 1. Go to Firebase Console -> Project Overview -> Project Settings
// 2. Scroll down to "Your apps" and copy the "firebaseConfig" object
// 3. Paste the values below replacing the placeholders

const firebaseConfig = {
  apiKey: "AIzaSyCu44-HYVIkyR3HL47L49EouQcdZLbDFPk",
  authDomain: "the-vault-23dd6.firebaseapp.com",
  projectId: "the-vault-23dd6",
  storageBucket: "the-vault-23dd6.firebasestorage.app",
  messagingSenderId: "725872241962",
  appId: "1:725872241962:web:7aa4c2861d4ad2b8964253"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Helper to check if keys are set
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
};
