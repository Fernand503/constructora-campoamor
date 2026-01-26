import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyD5SPFnTYGYnUZ_RDRYWNOrSd90uWt-VgI",
    authDomain: "campoamor-inmobiliaria.firebaseapp.com",
    projectId: "campoamor-inmobiliaria",
    storageBucket: "campoamor-inmobiliaria.firebasestorage.app",
    messagingSenderId: "203960160844",
    appId: "1:203960160844:web:a1835b3b9c1c4d66a7dae9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { serverTimestamp };