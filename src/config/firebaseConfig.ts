import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBjW5k615PsMeBT4uskn9JFliju04YoZ1I",
  authDomain: "fakt-33da2.firebaseapp.com",
  projectId: "fakt-33da2",
  storageBucket: "fakt-33da2.firebasestorage.app",
  messagingSenderId: "811992642333",
  appId: "1:811992642333:web:93d1636a1619859f0b67f4",
  measurementId: "G-XM8CKQLJHS"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter les services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;