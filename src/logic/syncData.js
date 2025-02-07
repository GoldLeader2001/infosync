import { doc, collection, setDoc, getDocs, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../static/fireBaseData";
import { radarScan } from "./radarScan";

export async function sendRadarTracks(inRangePings) {
    for (const ping of inRangePings) {
        console.log("sending ping")
        const pingId = `${ping.geometry.coordinates[0]}_${ping.geometry.coordinates[1]}`; // Unique ID based on coordinates
        const trackRef = doc(collection(db, "tracks"), pingId); // Create a document reference

        try {
            const existingDoc = await getDoc(trackRef); // Check if the document exists
            console.log('This is a SRT read');
            if (existingDoc.exists()) {
                console.log(`Ping at ${ping.geometry.coordinates} already exists in Firestore.`);
                continue; // Skip adding this document
            }

            await setDoc(trackRef, ping); // Add the new ping
            //console.log('This is a write');
            console.log(`Ping at ${ping.geometry.coordinates} successfully added to Firestore.`);
        } catch (error) {
            console.error("Error checking/adding ping to Firestore:", error);
        }
    }
}

export async function fetchSyncedTracks() {
    try {
        console.log("fetching tracks")
        const tracksCollection = collection(db, "tracks");
        const snapshot = await getDocs(tracksCollection);
        console.log("This is a FST read")
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

export async function sendCurPos(myAircraftData) {
    console.log("sending current position")
    const pingId = myAircraftData.features[0].properties.id; // Create a unique ID
    const trackRef = doc(collection(db, "reality"), pingId); // Create a document reference in the "reality" collection

    try {
        await setDoc(trackRef, myAircraftData.features[0]); // Send the ping data to Firestore
        console.log("This is a write");
    } catch (error) {
        console.error("Error adding ping to Firestore: ", error);
    }
}

export async function fetchFriendlies(myAircraftData) {
    try {
        console.log("fetching friendlies")
        const myId = myAircraftData.features[0].properties.id;
        const friendliesCollection = collection(db, "reality");
        const snapshot = await getDocs(friendliesCollection);
        console.log('This is a FF read');
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
        if ((await radarScan(aircraftData)).length != 0) {
            console.log("removing radar scan")
            const detectorId = aircraftData.features[0].properties.id; // Get the aircraft's ID
            const tracksCollection = collection(db, "tracks");
            const snapshot = await getDocs(tracksCollection);
            console.log('This is a RRS read');

            // Iterate through documents and delete matching ones
            const deletePromises = snapshot.docs
                .filter(doc => doc.data().properties?.detectorId === detectorId)
                .map(doc => deleteDoc(doc.ref));
            //console.log('This is a delete');

            await Promise.all(deletePromises);
            console.log(`Removed radar scans detected by aircraft ID: ${detectorId}`);
        }
    } catch (error) {
        console.error("Error removing radar scans from Firestore:", error);
    }
}