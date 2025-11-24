
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile,
  User 
} from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User | any; // Allow partial mock user object
  isSimulated?: boolean;
}

// --- LOCAL FALLBACK HELPERS ---
const AUTH_DB_KEY = 'THE_VAULT_USERS_DB';
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; 
  }
  return hash.toString();
};
const getLocalUsers = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '{}'); } catch { return {}; }
};
const saveLocalUser = (user: any) => {
    const users = getLocalUsers();
    users[user.email] = user;
    localStorage.setItem(AUTH_DB_KEY, JSON.stringify(users));
};

export const registerUser = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  try {
    // Try Real Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
        // Important: Update the display name immediately
        await updateProfile(userCredential.user, { displayName: name });
        // Return updated user object
        return { success: true, user: { ...userCredential.user, displayName: name } };
    }
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    // Fallback to Local Simulation if Firebase Config is invalid or network fails
    if (error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' || error.code === 'auth/configuration-not-found' || !auth.options.apiKey || error.code === 'auth/network-request-failed') {
        console.warn("Firebase unavailable, falling back to local auth:", error.code);
        const users = getLocalUsers();
        if (users[email]) return { success: false, message: "User already exists (Local)." };
        
        const newUser = {
            uid: 'local-' + Date.now(),
            email,
            displayName: name,
            passwordHash: simpleHash(password),
            emailVerified: false
        };
        saveLocalUser(newUser);
        return { success: true, user: newUser, isSimulated: true };
    }

    let msg = "Registration failed.";
    if (error.code === 'auth/email-already-in-use') msg = "Email already in use.";
    if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
    return { success: false, message: msg };
  }
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    // Fallback
    if (error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' || error.code === 'auth/configuration-not-found' || !auth.options.apiKey || error.code === 'auth/network-request-failed') {
         const users = getLocalUsers();
         const user = users[email];
         if (user && user.passwordHash === simpleHash(password)) {
             return { success: true, user: user, isSimulated: true };
         }
         return { success: false, message: "Invalid credentials (Local)." };
    }

    let msg = "Login failed.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
    return { success: false, message: msg };
  }
};

export const loginWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.warn("Google Auth Error:", error.code);
    
    // Fallback for missing keys
    if (error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' || error.code === 'auth/internal-error' || error.code === 'auth/configuration-not-found' || error.code === 'auth/network-request-failed') {
        const mockUser = {
            uid: 'google-sim-' + Date.now(),
            email: 'guest@gmail.com',
            displayName: 'Guest User',
            photoURL: 'https://ui-avatars.com/api/?name=Guest+User',
            emailVerified: true
        };
        return { success: true, user: mockUser, isSimulated: true };
    }

    return { success: false, message: error.message || "Google Sign-In failed." };
  }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (e) {
        console.log("Local logout");
    }
};
