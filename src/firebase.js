import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD32csbdSueydVmz0HAKNTFtvYXpHe4iD4",
  authDomain: "animemaxplay-61c5f.firebaseapp.com",
  projectId: "animemaxplay-61c5f",
  storageBucket: "animemaxplay-61c5f.firebasestorage.app",
  messagingSenderId: "93196191758",
  appId: "1:93196191758:web:a503199cdef72e2f6c545f",
  measurementId: "G-BVS4NQS75P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);