import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDy_YYUzcg_GSFDQlDg612LgFpNJonrAuE",
  authDomain: "split-app-c83e4.firebaseapp.com",
  projectId: "split-app-c83e4",
  storageBucket: "split-app-c83e4.firebasestorage.app",
  messagingSenderId: "720273557833",
  appId: "1:720273557833:web:00df18054c1ee2a5b7b298"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;