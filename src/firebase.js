import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0vM275qAD4e2gDtOf5-u2WwkVilDNWaA",
  authDomain: "maxplayseries-46f30.firebaseapp.com",
  projectId: "maxplayseries-46f30",
  storageBucket: "maxplayseries-46f30.firebasestorage.app",
  messagingSenderId: "328629723458",
  appId: "1:328629723458:web:c01857b4f3f73f8f3768db",
  measurementId: "G-SYFXZTK5CT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);