
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6shqdgJSC_2gxAy8jO_zt7WC4pK0oC50",
  authDomain: "robloxskinmaker.firebaseapp.com",
  projectId: "robloxskinmaker",
  storageBucket: "robloxskinmaker.firebasestorage.app",
  messagingSenderId: "155345711312",
  appId: "1:155345711312:web:1f2bea46ea162840c7eed5",
  measurementId: "G-LMSYEEE0Y3"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics only on client side
let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export default app;
