import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {

    apiKey: "AIzaSyDQbHoZM6WaQ07y_AnWkVyb6Nr_yo50NCw",
  
    authDomain: "cloud-code-editor.firebaseapp.com",
  
    projectId: "cloud-code-editor",
  
    storageBucket: "cloud-code-editor.firebasestorage.app",
  
    messagingSenderId: "782679252949",
  
    appId: "1:782679252949:web:3556241530c5e12d0f275c",
  
    measurementId: "G-HDTSXB8L2B"
  
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs };
