import { useState, useEffect, useRef } from 'react';
import { getInitialGeoJSON, resetLocation, moveAircraft } from './logic/myAirCraft';
import { filterPingsAndSendToFirestore } from './logic/radarScan';
import { fetchFriendlies, fetchSyncedTracks, removeAircraft, removeRadarScan, sendCurPos } from './logic/syncData';
import { collection, onSnapshot } from 'firebase/firestore';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { generateMap } from './mapbox/generateMap';
import { db, fetchAircraftData } from './static/fireBaseData';
import { Box, Button, MenuItem, FormControl, Select, InputLabel, Typography } from '@mui/material';

const INITIAL_CENTER = [-80.16373, 26.59597];

function App() {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [showMap, setShowMap] = useState(false);
    const [aircraftOptions, setAircraftOptions] = useState([]);
    const factionOptions = ["US", "NDEF"]
    const [myAircraftData, setMyAircraftData] = useState();
    const [factionSelected, setFactionSelected] = useState('');
    const [aircraftSelected, setAircraftSelected] = useState('');

    const handleFormSubmit = () => {
        // Set the selected option and show the map
        setShowMap(true);
    };

    const handleFactionOptionChange = async (event) => {
        const factionAircraft = await fetchAircraftData(event.target.value);
        setAircraftOptions(factionAircraft);
        setFactionSelected(event.target.value);
    };

    const handleAircraftOptionChange = async (event) => {
        setAircraftSelected(event.target.value);
        setMyAircraftData(getInitialGeoJSON(event.target.value));
    };

    const changePos = async (label) => {
        const resolvedAircraftData = await myAircraftData

        if (label === "Reset") {
            removeRadarScan(resolvedAircraftData);
            const newPosition = resetLocation(resolvedAircraftData);
            await setMyAircraftData(newPosition);
            sendCurPos(newPosition);
        } else {
            removeRadarScan(resolvedAircraftData);
            const newPosition = moveAircraft(label, resolvedAircraftData);
            await setMyAircraftData(newPosition);
            sendCurPos(newPosition);
        }
    }

    useEffect(() => {
        if (!showMap || !myAircraftData) return;

        const initializeMap = async () => {
            try {
                console.log('initmap')
                const resolvedAircraftData = await myAircraftData;
                const friendliesResult = await fetchFriendlies(resolvedAircraftData);
                const syncedTracksResult = await fetchSyncedTracks();
                const radarScan = await filterPingsAndSendToFirestore(resolvedAircraftData);

                generateMap(mapRef, mapContainerRef, INITIAL_CENTER, [
                    radarScan,
                    resolvedAircraftData,
                    syncedTracksResult,
                    friendliesResult,
                ], resolvedAircraftData.features[0].properties.aircraftData.radar_radius);

                sendCurPos(resolvedAircraftData);

                const listenForChanges = (collectionName) => {
                    const colRef = collection(db, collectionName);
                    return onSnapshot(colRef, async () => {
                        try {
                            if (colRef.id === "tracks" && mapRef) {
                                const syncTrackResult = await fetchSyncedTracks();
                                mapRef.current.getSource('syncedTracks').setData(syncTrackResult);
                            } else if (colRef.id === "reality" && mapRef) {
                                console.log("change in reality collection");
                                const updatedFriendlies = await fetchFriendlies(resolvedAircraftData);
                                mapRef.current.getSource('friendlies').setData(updatedFriendlies);

                                const curAircraftPos = resolvedAircraftData
                                mapRef.current.getSource('my-aircraft').setData(curAircraftPos);

                                const newRadarScan = await filterPingsAndSendToFirestore(resolvedAircraftData);
                                mapRef.current.getSource('tracks').setData(newRadarScan);
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
    }, [myAircraftData, showMap]);

    useEffect(() => {
        const handleBeforeUnload = async () => {
            const resolvedAircraftData = await myAircraftData;
            removeAircraft(resolvedAircraftData.features[0].properties.id);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [myAircraftData]);

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
                        Select an Option
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
                        <InputLabel id="select-aircraft-option-label">Select an Aircraft</InputLabel>
                        <Select
                            id="select-aircraft-option"
                            value={aircraftSelected}
                            label="Select an Option"
                            onChange={handleAircraftOptionChange}
                            disabled={factionSelected === ''}
                        >
                            {aircraftOptions.map((option, index) => (
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
                        disabled={aircraftSelected === ''}
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
                        <Typography variant="body1" sx={{ color: 'rgb(145, 0, 249)' }}>● Friendly Aircraft</Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 0, 0, 1)' }}>● Your Aircraft</Typography>
                        <Typography variant="body1" sx={{ color: 'rgb(0, 255, 0)' }}>● Your Tracks</Typography>
                        <Typography variant="body1" sx={{ color: 'rgb(54, 199, 210)' }}>● Friendly Tracks</Typography>
                    </Box>
                </>
            )}
        </>
    );
}

export default App;
