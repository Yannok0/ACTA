// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAK11pqUdIViToaCWmM-ClmUf-WPzB1qZ4",
  authDomain: "acta-7d4f1.firebaseapp.com",
  projectId: "acta-7d4f1",
  storageBucket: "acta-7d4f1.firebasestorage.app",
  messagingSenderId: "406680212455",
  appId: "1:406680212455:web:66050a716bf0dcbdefa342",
  measurementId: "G-4K3KJ9LX9Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);