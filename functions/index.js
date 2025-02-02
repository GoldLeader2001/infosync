import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();
const db = getFirestore();

const allowedOrigins = [
    "http://localhost:5173",
    "https://infosync-81e06.firebaseapp.com"
];

export const removeAircraft = onRequest(async (req, res) => {
    // Handle CORS
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    }
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");

    // Handle preflight (OPTIONS) requests
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {
        const targetId = req.query.targetId || req.body.targetId;

        if (!targetId) {
            res.status(400).send("Missing targetId parameter.");
            return;
        }

        const realityCollection = db.collection("reality");
        const tracksCollection = db.collection("tracks");

        // Query documents where properties.id matches targetId
        const realitySnapshot = await realityCollection.where("properties.id", "==", targetId).get();
        const tracksSnapshot = await tracksCollection.where("properties.detectorId", "==", targetId).get();

        if (realitySnapshot.empty) {
            res.status(404).send(`No vehicles found with properties.id: ${targetId}`);
            return;
        } else if (tracksSnapshot.empty) {
            res.status(404).send(`No tracks found with properties.detectorId: ${targetId}`);
        }

        // Delete each matching document
        const deleteRealityPromises = realitySnapshot.docs.map((doc) => doc.ref.delete());
        const deletetracksPromises = tracksSnapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deleteRealityPromises);
        await Promise.all(deletetracksPromises);

        res.status(200).send(`Deleted ${realitySnapshot.size} documents with properties.id: ${targetId}`);
        res.status(200).send(`Deleted ${tracksCollection.size} documents with properties.id: ${targetId}`);
    } catch (error) {
        console.error("Error deleting documents:", error);
        res.status(500).send("Error deleting documents.");
    }
});
