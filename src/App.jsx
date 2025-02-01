import { useRef, useEffect } from 'react'
import { myGeoJSON } from './logic/myAirCraft';
import { radarScan } from './logic/radarScan';
import { fetchFriendlies, fetchSyncedTracks, removeAircraft, sendCurPos } from './logic/syncData';
import { collection, onSnapshot } from 'firebase/firestore';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'
import { generateMap } from './mapbox/generateMap';
import { db } from './static/fireBaseData';


const INITIAL_CENTER = [-80.16373, 26.59597]

function App() {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);


    useEffect(() => {
        const initializeMap = async () => {
            try {
                // Wait for friendlies to be fetched
                const friendliesResult = await fetchFriendlies(myGeoJSON);
                const syncedTracksResult = await fetchSyncedTracks();
    
                console.log(friendliesResult); // Ensures friendlies are resolved before logging
    
                generateMap(mapRef, mapContainerRef, INITIAL_CENTER, [
                    radarScan, 
                    myGeoJSON, 
                    syncedTracksResult, 
                    friendliesResult
                ]);
    
                sendCurPos(myGeoJSON);
    
                // Function to listen for changes in a collection
                const listenForChanges = (collectionName) => {
                    const colRef = collection(db, collectionName);
                    return onSnapshot(colRef, async () => {
                        try {
                            console.log("change detected");
    
                            const syncTrackResult = await fetchSyncedTracks();
                            mapRef.current.getSource('syncedTracks').setData(syncTrackResult);
    
                            const updatedFriendlies = await fetchFriendlies(myGeoJSON);
                            mapRef.current.getSource('friendlies').setData(updatedFriendlies);
                        } catch (err) {
                            console.error("Error updating map data:", err);
                        }
                    });
                };
    
                // Listen for changes in both "tracks" and "reality"
                const unsubscribeTracks = listenForChanges("tracks");
                const unsubscribeReality = listenForChanges("reality");
    
                // Cleanup listeners when component unmounts
                return () => {
                    unsubscribeTracks();
                    unsubscribeReality();
                };
    
            } catch (error) {
                console.error("Error initializing map:", error);
            }
        };
    
        initializeMap();
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            removeAircraft(myGeoJSON.features[0].properties.id);
            event.returnValue = ''; // Standard way to trigger the confirmation dialog
            
        };
    
        window.addEventListener("beforeunload", handleBeforeUnload);
    
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    return (
        <>
            <div id='map-container' ref={mapContainerRef} />
        </>
    )
}

export default App