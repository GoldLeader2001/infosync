// Import Firebase modules (ensure you've installed Firebase SDK and initialized Firebase)
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCyC4i__dYgro7Qo1lCGlc3RATQq8ZUm44",
    authDomain: "infosync-81e06.firebaseapp.com",
    projectId: "infosync-81e06",
    storageBucket: "infosync-81e06.firebasestorage.app",
    messagingSenderId: "279611834237",
    appId: "1:279611834237:web:fcf65339fc271d16a7d614"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Function to fetch data from Firestore
export async function fetchAircraftData() {
    try {
        const docRef = doc(db, "vehicles", "F-22"); // Fetch document by ID
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Aircraft data:", docSnap.data());
            return docSnap.data();
        } else {
            console.log("No such aircraft found!");
        }
    } catch (error) {
        console.error("Error retrieving aircraft by ID: ", error);
    }
}