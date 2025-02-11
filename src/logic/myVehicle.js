import { v4 as uuidv4 } from 'uuid';

// Define the bounds for latitude and longitude
const latMin = 26.43274;
const latMax = 26.74565;
const lonMin = -80.45975;
const lonMax = -79.99789;

// Function to generate random latitude and longitude within a specific range
function generateRandomCoordinates(latMin, latMax, lonMin, lonMax) {
    const randomLat = Math.random() * (latMax - latMin) + latMin;
    const randomLon = Math.random() * (lonMax - lonMin) + lonMin;
    return [randomLon, randomLat]; // Return in [longitude, latitude] format
}

// Function to fetch vehicle data and create GeoJSON
export async function getInitialGeoJSON(vehicleData) {
    const randomCoordinates = generateRandomCoordinates(latMin, latMax, lonMin, lonMax);

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": { vehicleData, id: uuidv4() },
                "geometry": {
                    "type": "Point",
                    "coordinates": randomCoordinates // Use the random coordinates
                }
            }
        ]
    };
}

// Function to reset location (randomize coordinates and return updated GeoJSON)
export function resetLocation(myGeoJSON) {
    const randomCoordinates = generateRandomCoordinates(latMin, latMax, lonMin, lonMax);

    // Update the coordinates of the first feature in the GeoJSON
    myGeoJSON.features[0].geometry.coordinates = randomCoordinates;

    // Return the updated myGeoJSON
    return myGeoJSON;
}

// Function to reset location (randomize coordinates and return updated GeoJSON)
export function moveVehicle(label, myGeoJSON) {
    const curLon = myGeoJSON.features[0].geometry.coordinates[0]
    const curLat = myGeoJSON.features[0].geometry.coordinates[1]

    if (label === "↗") { // Northeast
        myGeoJSON.features[0].geometry.coordinates = [
            curLon + 0.01,
            curLat + 0.01
        ];
    } else if (label === "↖") { // Northwest
        myGeoJSON.features[0].geometry.coordinates = [
            curLon - 0.01,
            curLat + 0.01
        ];
    } else if (label === "↘") { // Southeast
        myGeoJSON.features[0].geometry.coordinates = [
            curLon + 0.01,
            curLat - 0.01
        ];
    } else if (label === "↙") { // Southwest
        myGeoJSON.features[0].geometry.coordinates = [
            curLon - 0.01,
            curLat - 0.01
        ];
    } else if (label === "→") { // East
        myGeoJSON.features[0].geometry.coordinates = [
            curLon + 0.01,
            curLat
        ];
    } else if (label === "←") { // West
        myGeoJSON.features[0].geometry.coordinates = [
            curLon - 0.01,
            curLat
        ];
    } else if (label === "↑") { // North
        myGeoJSON.features[0].geometry.coordinates = [
            curLon,
            curLat + 0.01
        ];
    } else if (label === "↓") { // South
        myGeoJSON.features[0].geometry.coordinates = [
            curLon,
            curLat - 0.01
        ];
    }

    // Return the updated myGeoJSON
    return myGeoJSON;
}