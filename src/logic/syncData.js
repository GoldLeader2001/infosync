import { doc, collection, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../static/fireBaseData";

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
        console.log(myAircraftData);
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
//export const friendlies = fetchFriendlies(myGeoJSON);

//API call when user leaves the site
export async function removeAircraft(targetId) {
    const url = "https://removeaircraft-dfimopxyya-uc.a.run.app";
    const data = JSON.stringify({ targetId });

    const blob = new Blob([data], { type: "application/json" });
    navigator.sendBeacon(url, blob);
}

export async function removeRadarScan(aircraftData) {
    try {
        const detectorId = aircraftData.features[0].properties.id; // Get the aircraft's ID
        const tracksCollection = collection(db, "tracks"); 
        const snapshot = await getDocs(tracksCollection);

        // Iterate through documents and delete matching ones
        const deletePromises = snapshot.docs
            .filter(doc => doc.data().properties?.detectorId === detectorId)
            .map(doc => deleteDoc(doc.ref));

        await Promise.all(deletePromises);
        console.log(`Removed radar scans detected by aircraft ID: ${detectorId}`);
    } catch (error) {
        console.error("Error removing radar scans from Firestore:", error);
    }
}