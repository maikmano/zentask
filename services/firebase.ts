
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYyM4Jb3Sw2tBPhgba1gUWYBJzh7S4Pmo",
  authDomain: "zendesk-99ea0.firebaseapp.com",
  projectId: "zendesk-99ea0",
  storageBucket: "zendesk-99ea0.firebasestorage.app",
  messagingSenderId: "786801029132",
  appId: "1:786801029132:web:6d4e7cc4fbfa6e68ee7e29",
  measurementId: "G-K633095XZ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
// Importing these after initializeApp (or via side-effect imports in ESM) 
// ensures the components register themselves with the singleton app instance correctly.
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export app instance as default
export default app;
