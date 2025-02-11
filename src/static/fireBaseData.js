// Import Firebase modules (ensure you've installed Firebase SDK and initialized Firebase)
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

// Function to fetch all data from Firestore collection
export async function fetchVehicleData(faction) {
    try {
        const colRef = collection(db, "vehicles"); // Reference to the "vehicles" collection
        const querySnapshot = await getDocs(colRef);
        console.log('This is a read')

        // Map through the documents and return their data
        const vehicleData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data()}))
        .filter(doc => doc.faction === faction);

        if (vehicleData.length > 0) {
            //console.log("vehicle data:", vehicleData);
            return vehicleData; // Return all documents in the collection
        } else {
            //console.log("No vehicle data found!");
            return [];
        }
    } catch (error) {
        console.error("Error retrieving vehicle data: ", error);
    }
}