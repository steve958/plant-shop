import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const environmentConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Temporary compatibility configuration. Remove after the replacement Firebase
// project is created and its values are supplied through .env.local.
const legacyConfig = {
  apiKey: "AIzaSyA-Kvmv5HbHZtY5UQvb8OlO_D8Ipg8zm6E",
  authDomain: "web-shop-model.firebaseapp.com",
  projectId: "web-shop-model",
  storageBucket: "web-shop-model.appspot.com",
  messagingSenderId: "232308404854",
  appId: "1:232308404854:web:237a1f6547c4ea2687e557",
};

const hasEnvironmentConfig = Object.values(environmentConfig).every(Boolean);
const firebaseConfig = hasEnvironmentConfig ? environmentConfig : legacyConfig;

if (import.meta.env.DEV && !hasEnvironmentConfig) {
  console.info(
    "Plant Shop is using the legacy Firebase project. Add .env.local using .env.example to connect the replacement project."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
