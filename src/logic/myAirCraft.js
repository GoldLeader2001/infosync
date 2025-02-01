import { fetchAircraftData } from "../static/fireBaseData";
import { v4 as uuidv4 } from 'uuid';

// Function to generate random latitude and longitude within a specific range
function generateRandomCoordinates(latMin, latMax, lonMin, lonMax) {
    const randomLat = Math.random() * (latMax - latMin) + latMin;
    const randomLon = Math.random() * (lonMax - lonMin) + lonMin;
    return [randomLon, randomLat]; // Return in [longitude, latitude] format
}

// Define the bounds for latitude and longitude
const latMin = 26.43274;
const latMax = 26.74565;
const lonMin = -80.45975;
const lonMax = -79.99789;

// Generate random coordinates
const randomCoordinates = generateRandomCoordinates(latMin, latMax, lonMin, lonMax);
const airCraftData = await fetchAircraftData();


// Create the GeoJSON with the generated coordinates
export const myGeoJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {airCraftData, id: uuidv4()},
            "geometry": {
                "type": "Point",
                "coordinates": randomCoordinates // Use the random coordinates
            }
        }
    ]
};