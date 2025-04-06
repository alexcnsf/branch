const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const { getStorage } = require('firebase/storage');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3unrDKyhIAdm1K2apaTdTVJfSojKduXE",
  authDomain: "outdoorapp-70d3a.firebaseapp.com",
  projectId: "outdoorapp-70d3a",
  storageBucket: "outdoorapp-70d3a.firebasestorage.app",
  messagingSenderId: "915617596103",
  appId: "1:915617596103:web:9ac91ffaf684df34e0b4e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

module.exports = { db, auth, storage }; 