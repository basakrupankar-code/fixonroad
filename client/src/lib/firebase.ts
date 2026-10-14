import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const sanitize = (val?: string): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

export const getFirebaseConfig = () => {
  // Supports Vite VITE_* as well as NEXT_PUBLIC_* fallbacks for cross-framework compatibility
  const apiKey = sanitize(
    import.meta.env.VITE_FIREBASE_API_KEY || (import.meta.env as any).NEXT_PUBLIC_FIREBASE_API_KEY
  );
  const authDomain = sanitize(
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (import.meta.env as any).NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  );
  const projectId = sanitize(
    import.meta.env.VITE_FIREBASE_PROJECT_ID || (import.meta.env as any).NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
  const storageBucket = sanitize(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (import.meta.env as any).NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
  const messagingSenderId = sanitize(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (import.meta.env as any).NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  );
  const appId = sanitize(
    import.meta.env.VITE_FIREBASE_APP_ID || (import.meta.env as any).NEXT_PUBLIC_FIREBASE_APP_ID
  );

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
};

let app: FirebaseApp | undefined;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();

// Force account chooser so any user/mechanic can choose their own account
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

try {
  const config = getFirebaseConfig();
  if (config.apiKey && config.projectId) {
    // Singleton check: prevent multi-instance reinitialization in SPA / Vite HMR
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
  } else {
    console.warn(
      "⚠️ Firebase credentials missing or incomplete. Google Sign-in will be disabled until VITE_FIREBASE_* variables are set."
    );
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

/**
 * Maps Firebase Auth error codes to user-friendly messages with actionable resolution guidance.
 */
export function getFirebaseErrorMessage(error: any): string {
  if (!error) return "An unknown authentication error occurred.";
  const code = error.code || "";
  const msg = error.message || "";

  switch (code) {
    case "auth/popup-closed-by-user":
      return "Sign-in cancelled: The Google popup was closed before completing.";
    case "auth/cancelled-popup-request":
      return "Another authentication request is currently in progress.";
    case "auth/popup-blocked":
      return "Pop-up was blocked by your browser. Please allow pop-ups for this website and try again.";
    case "auth/unauthorized-domain": {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      return `Domain not authorized (${currentHost}). Please add "${currentHost}" to Firebase Console > Authentication > Settings > Authorized Domains.`;
    }
    case "auth/configuration-not-found":
    case "auth/operation-not-allowed":
      return "Google Sign-In is not enabled for this project. Please enable Google provider in Firebase Console > Authentication > Sign-in method.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "Invalid Firebase API Key. Please verify your VITE_FIREBASE_API_KEY environment variable in your Vercel or .env settings.";
    case "auth/network-request-failed":
      return "Network connection error while reaching Google. Please verify your internet connection and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email address under a different sign-in method.";
    case "auth/user-disabled":
      return "This account has been disabled by an administrator.";
    case "auth/internal-error":
      return "Firebase internal authentication error. Please retry in a few moments.";
    default:
      if (msg.toLowerCase().includes("network")) {
        return "Network error while connecting to Google. Please check your connection.";
      }
      return msg || "Google authentication failed. Please try again.";
  }
}

export { app, auth, googleProvider };
