// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKwU5zD3OomJkRGfFsSp997R6PNmtiDEY",
  authDomain: "cubetimer-8e71e.firebaseapp.com",
  projectId: "cubetimer-8e71e",
  storageBucket: "cubetimer-8e71e.appspot.com",
  messagingSenderId: "545504298885",
  appId: "1:545504298885:web:7876aba6ef17286dc4e6ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const timesRef = collection(db, "times");