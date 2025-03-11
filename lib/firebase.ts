import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore"; // ✅ Import Firestore Timestamp

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIFFw97latHgrCMLu8Ihy9tZCeIE7bKN8",
  authDomain: "theboysclubchat.firebaseapp.com",
  projectId: "theboysclubchat",
  storageBucket: "theboysclubchat.firebasestorage.app",
  messagingSenderId: "889447739074",
  appId: "1:889447739074:web:c058aaeac95658f874955b",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firestore database instance
const db = getFirestore(app);

// Define a Message type (optional but recommended for TypeScript)
interface Message {
  id?: string; // Optional for Firestore IDs
  username: string;
  message: string;
  color: string;
  timestamp: Timestamp | null; // ✅ Correct TypeScript typing
}

// Function to send a message
export const sendMessage = async (username: string, message: string, color: string) => {
  try {
    await addDoc(collection(db, "messages"), {
      username,
      message,
      color,
      timestamp: serverTimestamp(), // Use Firestore server timestamp
    });
    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

// Function to listen for messages
export const listenForMessages = (callback: (messages: Message[]) => void) => {
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc")); // Order by timestamp
  onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as Message,
      }));
      callback(messages);
    },
    (error) => {
      console.error("Error fetching messages:", error);
    }
  );
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ Signed in as:", result.user.displayName);
  } catch (error) {
    console.error("❌ Sign-in failed:", error);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser; // Returns the current signed-in user
};