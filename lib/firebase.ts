import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTs8YZgKnuAHAga_eD08SBvkQxB4dhIK0",
  authDomain: "credenciamento-5fa5f.firebaseapp.com",
  projectId: "credenciamento-5fa5f",
  storageBucket: "credenciamento-5fa5f.appspot.com",
  messagingSenderId: "20789981047",
  appId: "1:20789981047:web:596d8aa594babfd6763b72"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
