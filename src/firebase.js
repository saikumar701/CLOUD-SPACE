import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDHcIcSknEZzv1afEW7z9UzD9ltOzfkFIY",
  authDomain: "fir-study-4cad9.firebaseapp.com",
  projectId: "fir-study-4cad9",
  storageBucket: "fir-study-4cad9.appspot.com",
  messagingSenderId: "30102325697",
  appId: "1:30102325697:web:0a8ccdc987ce2a32cc4740",
  measurementId: "G-X4WTZY5KM7"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, provider, db, storage };
