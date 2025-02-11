import { useState, useEffect, useRef } from 'react';
import { getInitialGeoJSON, resetLocation, moveVehicle } from './logic/myVehicle';
import { filterPingsAndSendToFirestore } from './logic/radarScan';
import { fetchFriendlyVehicle, fetchFriendlyPillboxes, fetchSyncedTracks, removeVehicle, removeRadarScan, sendCurPos } from './logic/syncData';
import { collection, onSnapshot } from 'firebase/firestore';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { generateMap } from './mapbox/generateMap';
import { db, fetchVehicleData } from './static/fireBaseData';
import { Box, Button, MenuItem, FormControl, Select, InputLabel, Typography } from '@mui/material';

const INITIAL_CENTER = [-80.16373, 26.59597];

function App() {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [showMap, setShowMap] = useState(false);
    const [vehicleOptions, setVehicleOptions] = useState([]);
    const factionOptions = ["US", "NDEF"]
    const [myVehicleData, setMyVehicleData] = useState();
    const [factionSelected, setFactionSelected] = useState('');
    const [vehicleSelected, setVehicleSelected] = useState('');

    const handleFormSubmit = () => {
        // Set the selected option and show the map
        setShowMap(true);
    };

    const handleFactionOptionChange = async (event) => {
        const factionVehicle = await fetchVehicleData(event.target.value);
        setVehicleOptions(factionVehicle);
        setFactionSelected(event.target.value);
    };

    const handleVehicleOptionChange = async (event) => {
        setVehicleSelected(event.target.value);
        setMyVehicleData(getInitialGeoJSON(event.target.value));
    };

    const changePos = async (label) => {
        const resolvedVehicleData = await myVehicleData

        if (label === "Reset") {
            removeRadarScan(resolvedVehicleData);
            const newPosition = resetLocation(resolvedVehicleData);
            await setMyVehicleData(newPosition);
            sendCurPos(newPosition);
        } else {
            removeRadarScan(resolvedVehicleData);
            const newPosition = moveVehicle(label, resolvedVehicleData);
            await setMyVehicleData(newPosition);
            sendCurPos(newPosition);
        }
    }

    useEffect(() => {
        if (!showMap || !myVehicleData) return;

        const initializeMap = async () => {
            try {
                console.log('initmap')
                const resolvedVehicleData = await myVehicleData;
                const [friendliesResult, syncedTracksResult, aesaRadarScan, friendlyPillboxes] = await Promise.all([
                    fetchFriendlyVehicle(resolvedVehicleData),
                    fetchSyncedTracks(resolvedVehicleData),
                    filterPingsAndSendToFirestore(resolvedVehicleData),
                    fetchFriendlyPillboxes(resolvedVehicleData)
                ]);

                generateMap(mapRef, mapContainerRef, INITIAL_CENTER, [
                    aesaRadarScan,
                    resolvedVehicleData,
                    syncedTracksResult,
                    friendliesResult,
                    friendlyPillboxes
                ], resolvedVehicleData.features[0].properties.vehicleData.radar_radius);

                sendCurPos(resolvedVehicleData);

                const listenForChanges = (collectionName) => {
                    const colRef = collection(db, collectionName);
                    return onSnapshot(colRef, async () => {
                        try {
                            if (colRef.id === "tracks" && mapRef) {
                                const syncTrackResult = await fetchSyncedTracks(resolvedVehicleData);
                                mapRef.current.getSource('synced-tracks').setData(syncTrackResult);
                            } else if (colRef.id === "reality" && mapRef) {
                                console.log("change in reality collection");
                                removeRadarScan(resolvedVehicleData);
                                const updatedFriendlies = await fetchFriendlyVehicle(resolvedVehicleData);
                                mapRef.current.getSource('friendly-vehicle').setData(updatedFriendlies);

                                const curVehiclePos = resolvedVehicleData
                                mapRef.current.getSource('my-vehicle').setData(curVehiclePos);

                                const newRadarScan = await filterPingsAndSendToFirestore(resolvedVehicleData);
                                mapRef.current.getSource('tracks').setData(newRadarScan);

                                const newPillBoxes = await fetchFriendlyPillboxes(resolvedVehicleData);
                                mapRef.current.getSource('friendly-pillbox').setData(newPillBoxes);
                            } else {
                                //console.log('try again');
                            }
                        } catch (err) {
                            console.error("Error updating map data:", err);
                        }
                    });
                };
                const unsubscribeReality = listenForChanges("reality");
                const unsubscribeTracks = listenForChanges("tracks");

                return () => {
                    unsubscribeReality();
                    unsubscribeTracks();
                };

            } catch (error) {
                console.error("Error initializing map:", error);
            }
        };

        initializeMap();
    }, [myVehicleData, showMap]);

    useEffect(() => {
        const handleBeforeUnload = async () => {
            const resolvedVehicleData = await myVehicleData;
            console.log(resolvedVehicleData.features[0].properties.id);
            removeVehicle(resolvedVehicleData.features[0].properties.id);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [myVehicleData]);

    return (
        <>
            {!showMap && (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        backgroundColor: '#333',
                        padding: '2rem',
                        borderRadius: '8px',
                        width: '100%',
                        height: "100%",
                        margin: 'auto',
                        color: 'white'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Pick your Vehicle
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel id="select-faction-option-label">Select a Faction</InputLabel>
                        <Select
                            id="select-faction-option"
                            value={factionSelected}
                            label="Select an Option"
                            onChange={handleFactionOptionChange}
                            sx={{ marginBottom: 2 }}
                        >
                            {factionOptions.map((option, index) => (
                                <MenuItem key={index} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel id="select-vehicle-option-label">Select a Vehicle</InputLabel>
                        <Select
                            id="select-vehicle-option"
                            value={vehicleSelected}
                            label="Select an Option"
                            onChange={handleVehicleOptionChange}
                            disabled={factionSelected === ''}
                        >
                            {vehicleOptions.map((option, index) => (
                                <MenuItem key={index} value={option}>
                                    {option.id} {/* Assuming the option has 'id' and 'name' fields */}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFormSubmit}
                        disabled={vehicleSelected === ''}
                        sx={{ marginTop: '1rem' }}
                    >
                        Submit
                    </Button>
                </Box>
            )}
            {showMap && (
                <>
                    <div id="map-container" ref={mapContainerRef} />
                    <Box sx={{ position: 'absolute', bottom: 20, left: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gridTemplateRows: 'repeat(3, 50px)', gap: '5px', backgroundColor: 'rgba(128, 128, 128, 0.5)', padding: '10px', borderRadius: '10px' }}>
                        {['↖', '↑', '↗', '←', 'Reset', '→', '↙', '↓', '↘'].map((label, index) => (
                            <Button key={index} variant="contained" sx={{ backgroundColor: 'rgba(128, 128, 128, 0.7)', color: 'white', minWidth: '50px', height: '50px' }} onClick={() => changePos(label)}>
                                {label}
                            </Button>
                        ))}
                    </Box>
                    <Box sx={{ position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0, 0, 0, 0)', padding: '10px', borderRadius: '5px' }}>
                        <Typography variant="body1" sx={{ color: 'rgb(145, 0, 249)' }}>● Friendly Vehicle</Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 0, 0, 1)' }}>● Your Vehicle</Typography>
                        <Typography variant="body1" sx={{ color: 'rgb(0, 255, 0)' }}>● Your Tracks</Typography>
                        <Typography variant="body1" sx={{ color: 'rgb(54, 199, 210)' }}>● Friendly Tracks</Typography>
                    </Box>
                </>
            )}
        </>
    );
}

export default App;
