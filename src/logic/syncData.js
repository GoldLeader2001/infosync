import { doc, collection, setDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { db } from "../static/fireBaseData";
import { myGeoJSON } from "./myAirCraft";

export async function sendRadarTracks(inRangePings) {
    // Send each ping as its own document to Firestore
    for (const ping of inRangePings) {
        const pingId = `${ping.geometry.coordinates[0]}_${ping.geometry.coordinates[1]}`; // Create a unique ID based on coordinates
        const trackRef = doc(collection(db, "tracks"), pingId); // Create a document reference in the "tracks" collection

        try {
            await setDoc(trackRef, ping); // Send the ping data to Firestore
            console.log(`Ping at ${ping.geometry.coordinates} successfully added to Firestore.`);
        } catch (error) {
            console.error("Error adding ping to Firestore: ", error);
        }
    }
}

export async function fetchSyncedTracks() {
    try {
        const tracksCollection = collection(db, "tracks");
        const snapshot = await getDocs(tracksCollection);
        const features = snapshot.docs.map(doc => doc.data()); // Each document is a GeoJSON feature

        return {
            type: "FeatureCollection",
            features: features
        };
    } catch (error) {
        console.error("Error fetching tracks from Firestore:", error);
        return { type: "FeatureCollection", features: [] }; // Return an empty GeoJSON collection in case of error
    }
}
export const syncedTracks = await fetchSyncedTracks();

export async function sendCurPos(myAircraftData) {
    const pingId = myAircraftData.features[0].properties.id; // Create a unique ID based on coordinates
    const trackRef = doc(collection(db, "reality"), pingId); // Create a document reference in the "tracks" collection

    try {
        await setDoc(trackRef, myAircraftData.features[0]); // Send the ping data to Firestore
    } catch (error) {
        console.error("Error adding ping to Firestore: ", error);
    }
}

export async function fetchFriendlies(myAircraftData) {
    try {
        const myId = myAircraftData.features[0].properties.id;
        const friendliesCollection = collection(db, "reality");
        const snapshot = await getDocs(friendliesCollection);
        const features = snapshot.docs.map(doc => doc.data()).filter(feature => feature.properties.id !== myId); // Each document is a GeoJSON feature


        return {
            type: "FeatureCollection",
            features: features
        };
    } catch (error) {
        console.error("Error fetching friendlies from Firestore:", error);
        return { type: "FeatureCollection", features: [] }; // Return an empty GeoJSON collection in case of error
    }
}
export const friendlies = fetchFriendlies(myGeoJSON);


export async function removeAircraft(targetId) {
    try {
        const realityCollection = collection(db, "reality");

        // Query documents where properties.id matches targetId
        const q = query(realityCollection, where("properties.id", "==", targetId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`No documents found with properties.id: ${targetId}`);
            return;
        }

        // Delete each matching document
        const deletePromises = snapshot.docs.map((docSnapshot) =>
            deleteDoc(doc(db, "reality", docSnapshot.id))
        );

        await Promise.all(deletePromises);

        console.log(`Deleted ${snapshot.size} documents with properties.id: ${targetId}`);
    } catch (error) {
        console.error("Error deleting documents:", error);
    }
}