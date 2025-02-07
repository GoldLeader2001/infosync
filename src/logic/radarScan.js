import { geodata } from "../static/globalGeoJSON";
import { sendRadarTracks } from "./syncData";

// Function to calculate distance between two lat/lon points using the Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
    const R = 3960; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
}

// Function to filter pings within 2 miles of the myGeoJSON location and send to Firestore
export async function filterPingsAndSendToFirestore(myAircraftData) {
    const inRangePings = radarScan(myAircraftData);
    if(inRangePings.length != 0)
         
        sendRadarTracks(inRangePings);

        // Return a new GeoJSON object with the filtered pings
        return {
            type: "FeatureCollection",
            features: inRangePings
        };
}

// Function to filter pings within 2 miles of the myGeoJSON location and send to Firestore
export function radarScan(myAircraftData) {
    const myCoordinates = myAircraftData.features[0].geometry.coordinates;
    const myLat = myCoordinates[1];
    const myLon = myCoordinates[0];
    
    // Filter pings within 2 miles of the myGeoJSON location
    const inRangePings = geodata.features.filter((ping) => {
        const pingCoordinates = ping.geometry.coordinates;
        const pingLat = pingCoordinates[1];
        const pingLon = pingCoordinates[0];

        // Calculate the distance between the ping and the myGeoJSON location
        const distance = haversine(myLat, myLon, pingLat, pingLon);

        if (distance <= myAircraftData.features[0].properties.aircraftData.radar_radius) {
            ping.properties.detectorId = myAircraftData.features[0].properties.id;  // Add the detectorId to properties
        }
        
        // Return true if the distance is less than or equal to 2 miles
        return distance <= myAircraftData.features[0].properties.aircraftData.radar_radius;
    });

    return inRangePings
}