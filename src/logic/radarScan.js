import { globalGeodata } from "../static/globalGeoJSON";
import { fetchEnemyVehicle, sendRadarTracks } from "./syncData";

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

// Function to calculate the endpoint given a starting point, distance (meters), and bearing (degrees)
function destinationPoint(lon, lat, distance, bearing) {
    const R = 3860; // Earth’s radius in meters
    const φ1 = lat * Math.PI / 180;
    const λ1 = lon * Math.PI / 180;
    const θ = bearing * Math.PI / 180;
    const δ = distance / R;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

    return [λ2 * 180 / Math.PI, φ2 * 180 / Math.PI]; // Convert back to degrees
}

function getBearing(lat1, lon1, lat2, lon2) {
    const toRadians = (deg) => deg * Math.PI / 180;
    const toDegrees = (rad) => (rad * 180 / Math.PI + 360) % 360; // Normalize to 0-360°

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const λ1 = toRadians(lon1);
    const λ2 = toRadians(lon2);

    const deltaLambda = λ2 - λ1;

    const y = Math.sin(deltaLambda) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(deltaLambda);

    const θ = Math.atan2(y, x);
    return toDegrees(θ); // Convert radians to degrees
}

// Function to filter pings within 2 miles of the myGeoJSON location and send to Firestore
export async function filterPingsAndSendToFirestore(myVehicleData) {
    const inRangePings = await aesaRadarScan(myVehicleData);
    console.log(inRangePings);
    if(inRangePings.length != 0)
         
        sendRadarTracks(inRangePings);

        // Return a new GeoJSON object with the filtered pings
        return {
            type: "FeatureCollection",
            features: inRangePings
        };
}

// Function to filter pings within 2 miles of the myGeoJSON location and send to Firestore
export async function aesaRadarScan(myVehicleData) {
    const myCoordinates = myVehicleData.features[0].geometry.coordinates;
    const myLat = myCoordinates[1];
    const myLon = myCoordinates[0];
    
    // Filter pings within 2 miles of the myGeoJSON location
    const inRangePillBoxTracks = globalGeodata.features.filter((ping) => {
        const pingCoordinates = ping.geometry.coordinates;
        const pingLat = pingCoordinates[1];
        const pingLon = pingCoordinates[0];

        //Check faction
        if (ping.properties.vehicleData.faction === myVehicleData.features[0].properties.vehicleData.faction){
            return false;
        }

        // Calculate the distance between the ping and the myGeoJSON location
        const distance = haversine(myLat, myLon, pingLat, pingLon);

        if (distance <= myVehicleData.features[0].properties.vehicleData.radar_radius) {
            ping.properties.detectorId = myVehicleData.features[0].properties.id;  // Add the detectorId to properties
        }
        
        // Return true if the distance is less than or equal to 2 miles
        return distance <= myVehicleData.features[0].properties.vehicleData.radar_radius;
    });

    const enemyAircrafft = await fetchEnemyVehicle(myVehicleData);
    const inRangeVehicleTracks = enemyAircrafft.features.filter((ping) => {
        const pingCoordinates = ping.geometry.coordinates;
        const pingLat = pingCoordinates[1];
        const pingLon = pingCoordinates[0];

        // Calculate the distance between the ping and the myGeoJSON location
        const distance = haversine(myLat, myLon, pingLat, pingLon);

        if (distance <= myVehicleData.features[0].properties.vehicleData.radar_radius) {
            ping.properties.detectorId = myVehicleData.features[0].properties.id;  // Add the detectorId to properties
        }
        
        // Return true if the distance is less than or equal to 2 miles
        return distance <= myVehicleData.features[0].properties.vehicleData.radar_radius;
    });

    return [...inRangePillBoxTracks, ...inRangeVehicleTracks]
}


export async function bearingRadarScan(myVehicleData) {
    const myCoordinates = myVehicleData.features[0].geometry.coordinates;
    const myLat = myCoordinates[1];
    const myLon = myCoordinates[0];
    const radarRange = myVehicleData.features[0].properties.vehicleData.radar_radius;

    const enemyAircraft = await fetchEnemyVehicle(myVehicleData);
    const radarLines = enemyAircraft.features
        .filter((ping) => {
            const pingCoordinates = ping.geometry.coordinates;
            const pingLat = pingCoordinates[1];
            const pingLon = pingCoordinates[0];

            // Calculate the distance
            const distance = haversine(myLat, myLon, pingLat, pingLon);

            if (distance <= radarRange) {
                ping.properties.detectorId = myVehicleData.features[0].properties.id;
                return true;
            }
            return false;
        })
        .map((ping) => {
            const pingLat = ping.geometry.coordinates[1];
            const pingLon = ping.geometry.coordinates[0];

            // Compute the bearing for each detected enemy
            const bearing = getBearing(myLat, myLon, pingLat, pingLon);

            // Compute the endpoint for the radar scan line
            const endPoint = destinationPoint(myLon, myLat, radarRange, bearing); // Convert miles to meters

            return {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [myCoordinates, endPoint]
                },
                properties: {
                    bearing: bearing,
                    range: radarRange,
                    detectorId: myVehicleData.features[0].properties.id
                }
            };
        });

    return {
        type: "FeatureCollection",
        features: radarLines
    };
}