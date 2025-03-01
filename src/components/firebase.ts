import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage"; // Dodaj import za storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-Kvmv5HbHZtY5UQvb8OlO_D8Ipg8zm6E",
  authDomain: "web-shop-model.firebaseapp.com",
  projectId: "web-shop-model",
  storageBucket: "web-shop-model.appspot.com",
  messagingSenderId: "232308404854",
  appId: "1:232308404854:web:237a1f6547c4ea2687e557",
  measurementId: "G-8W6X5KLJD0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Inicijalizuj Storage
export const analytics = getAnalytics(app); 
