import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:demo:web:demo",
};

// Log configuration for debugging
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? 'Set' : 'Missing'
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('email');
provider.addScope('profile');

export async function signInWithGoogle() {
  try {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      throw new Error('Firebase configuration missing. Please check environment variables.');
    }
    
    const result = await signInWithPopup(auth, provider);
    console.log('Sign-in successful:', result.user?.email);
    return result;
  } catch (error: any) {
    console.error('Firebase auth error:', error);
    
    // Provide specific error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by browser. Please allow popups and try again.');
    } else if (error.code === 'auth/invalid-api-key') {
      throw new Error('Firebase configuration error. Please contact support.');
    } else {
      throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export function logout() {
  return signOut(auth);
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
