import { doc, collection, setDoc, getDocs, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../static/fireBaseData";
import { aesaRadarScan, bearingRadarScan } from "./radarScan";
import { globalGeodata } from "../static/globalGeoJSON";

//Send track within the users range to the DB
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
            console.log('This is a write');
            console.log(`Ping at ${ping.geometry.coordinates} successfully added to Firestore.`);
        } catch (error) {
            console.error("Error checking/adding ping to Firestore:", error);
        }
    }
}

//Retrieve tracks from the DB scanned by other radars
export async function fetchSyncedTracks(myVehicleData) {
    try {
        const resolvedVehicleData = await myVehicleData;
        console.log("fetching tracks")
        const tracksCollection = collection(db, "tracks");
        const snapshot = await getDocs(tracksCollection);
        console.log("This is a FST read")
        const features = snapshot.docs.map(doc => doc.data()).filter(feature => feature.properties.vehicleData.faction !== resolvedVehicleData.features[0].properties.vehicleData.faction); // Each document is a GeoJSON feature

        return {
            type: "FeatureCollection",
            features: features
        };
    } catch (error) {
        console.error("Error fetching tracks from Firestore:", error);
        return { type: "FeatureCollection", features: [] }; // Return an empty GeoJSON collection in case of error
    }
}

//Send current position of User's vehicle to the DB
export async function sendCurPos(myVehicleData) {
    console.log("sending current position")

    try {
        const pingId = myVehicleData.features[0].properties.id; // Create a unique ID
        const trackRef = doc(collection(db, "reality"), pingId); // Create a document reference in the "reality" collection
        await setDoc(trackRef, myVehicleData.features[0]); // Send the ping data to Firestore
        console.log("This is a write");
    } catch (error) {
        console.error("Error adding ping to Firestore: ", error);
    }
}

//Retrieve friendly vehicle positions from the DB
export async function fetchFriendlyVehicle(myVehicleData) {
    try {
        console.log("fetching friendlies")
        const myId = myVehicleData.features[0].properties.id;
        const friendliesCollection = collection(db, "reality");
        const snapshot = await getDocs(friendliesCollection);
        console.log('This is a FF read');
        const features = snapshot.docs.map(doc => doc.data()).filter(feature => feature.properties.id !== myId && feature.properties.vehicleData.faction == myVehicleData.features[0].properties.vehicleData.faction); // Each document is a GeoJSON feature


        return {
            type: "FeatureCollection",
            features: features
        };
    } catch (error) {
        console.error("Error fetching friendlies from Firestore:", error);
        return { type: "FeatureCollection", features: [] }; // Return an empty GeoJSON collection in case of error
    }
}

//Retrieve friendly vehicle positions from the DB
export async function fetchEnemyVehicle(myVehicleData) {
    try {
        console.log("fetching friendlies")
        const myId = myVehicleData.features[0].properties.id;
        const friendliesCollection = collection(db, "reality");
        const snapshot = await getDocs(friendliesCollection);
        console.log('This is a FF read');
        const features = snapshot.docs.map(doc => doc.data()).filter(feature => feature.properties.id !== myId && feature.properties.vehicleData.faction !== myVehicleData.features[0].properties.vehicleData.faction); // Each document is a GeoJSON feature


        return {
            type: "FeatureCollection",
            features: features
        };
    } catch (error) {
        console.error("Error fetching friendlies from Firestore:", error);
        return { type: "FeatureCollection", features: [] }; // Return an empty GeoJSON collection in case of error
    }
}

//API call when user leaves the site to remove the vehicle and it's tracks from the DB
export async function removeVehicle(targetId) {
    const url = "https://removeaircraft-dfimopxyya-uc.a.run.app";
    const data = JSON.stringify({ targetId });

    const blob = new Blob([data], { type: "application/json" });
    navigator.sendBeacon(url, blob);
}

//Remove tracks from the radar that are no longer in range of the radar
export async function removeRadarScan(vehicleData) {
    try {
        if ((await aesaRadarScan(vehicleData)).length != 0) {
            console.log("removing radar scan")
            const detectorId = vehicleData.features[0].properties.id; // Get the vehicle's ID
            const tracksCollection = collection(db, "tracks");
            const snapshot = await getDocs(tracksCollection);
            console.log('This is a RRS read');

            // Iterate through documents and delete matching ones
            const deletePromises = snapshot.docs
                .filter(doc => doc.data().properties?.detectorId === detectorId || doc.data().properties?.id === detectorId)
                .map(doc => deleteDoc(doc.ref));
            //console.log('This is a delete');

            await Promise.all(deletePromises);
            console.log(`Removed radar scans detected by vehicle ID: ${detectorId}`);
        }
    } catch (error) {
        console.error("Error removing radar scans from Firestore:", error);
    }
}

// Updated fetchFriendlyPillboxes to include radar scan lines
export async function fetchFriendlyPillboxes(vehicleData) {
    try {
        const friendlyPillboxes = filterGeoDataByFaction(vehicleData.features[0].properties.vehicleData.faction, globalGeodata);
        // Perform bearingRadarScan for each friendly pillbox and collect results
        const radarScanResults = await Promise.all(
            friendlyPillboxes.features.map(async (pillbox) => await bearingRadarScan({ features: [pillbox] }))
        );

        // Flatten the array of FeatureCollections into a single array of features
        const radarScanLines = radarScanResults.flatMap(scan => scan.features);

        return {
            type: "FeatureCollection",
            features: [...friendlyPillboxes.features, ...radarScanLines]
        };
    } catch (error) {
        console.error("Error fetching friendly pillboxes and radar lines:", error);
        return { type: "FeatureCollection", features: [] };
    }
}

//Base function to filter geoJSON based on Faction
function filterGeoDataByFaction(faction, geodata) {
    return {
        type: "FeatureCollection",
        features: geodata.features.filter(feature => feature.properties.vehicleData.faction === faction)
    };
}