// src/firebase-config.ts

import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCfr7p9pd-9b8qx6xxU8Lvl-92HVvTk2HM",
  authDomain: "login-2539b.firebaseapp.com",
  projectId: "login-2539b",
  storageBucket: "login-2539b.firebasestorage.app",
  messagingSenderId: "303785173965",
  appId: "1:303785173965:web:a4b44eb569d6bd2a1d1a84",
  measurementId: "G-KEFEZ340JW"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
