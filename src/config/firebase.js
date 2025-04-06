import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3unrDKyhIAdm1K2apaTdTVJfSojKduXE",
  authDomain: "outdoorapp-70d3a.firebaseapp.com",
  projectId: "outdoorapp-70d3a",
  storageBucket: "outdoorapp-70d3a.appspot.com",
  messagingSenderId: "915617596103",
  appId: "1:915617596103:web:9ac91ffaf684df34e0b4e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app; 