import { useState, useEffect, useRef } from 'react';
import { getInitialGeoJSON, resetLocation } from './logic/myAirCraft';
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
    const [selectedOption, setSelectedOption] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [options, setOptions] = useState([]);
    const [ myAircraftData, setMyAircraftData ] = useState();

    // Fetch aircraft data asynchronously
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const aircraftData = await fetchAircraftData();
                setOptions(aircraftData); // Assuming aircraftData is an array
            } catch (error) {
                console.error("Error fetching aircraft data:", error);
            }
        };

        fetchOptions();
    }, []); // Empty dependency array to run once when the component mounts

    const handleFormSubmit = () => {
        // Set the selected option and show the map
        setShowMap(true);
    };

    const handleOptionChange = async (event) => {
        setSelectedOption(event.target.value);
        setMyAircraftData(getInitialGeoJSON(event.target.value));
    };

    const changePos = async () => {
        const resolvedAircraftData = await myAircraftData
        const newPosition = resetLocation(resolvedAircraftData);
        removeRadarScan(resolvedAircraftData);
        await setMyAircraftData(newPosition);
        sendCurPos(newPosition);
    }

    useEffect(() => {
        if (!showMap || !myAircraftData) return;

        const initializeMap = async () => {
            try {
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
                            console.log("change detected");

                            const syncTrackResult = await fetchSyncedTracks();
                            mapRef.current.getSource('syncedTracks').setData(syncTrackResult);

                            const updatedFriendlies = await fetchFriendlies(resolvedAircraftData);
                            mapRef.current.getSource('friendlies').setData(updatedFriendlies);

                            const curAircraftPos = resolvedAircraftData
                            mapRef.current.getSource('my-aircraft').setData(curAircraftPos);

                            const newRadarScan = await filterPingsAndSendToFirestore(resolvedAircraftData);
                            mapRef.current.getSource('tracks').setData(newRadarScan);
                        } catch (err) {
                            console.error("Error updating map data:", err);
                        }
                    });
                };

                const unsubscribeTracks = listenForChanges("tracks");
                const unsubscribeReality = listenForChanges("reality");

                return () => {
                    unsubscribeTracks();
                    unsubscribeReality();
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
                        width: '300px',
                        margin: 'auto',
                        color: 'white'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Select an Option
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel id="select-option-label">Select an Option</InputLabel>
                        <Select
                            labelId="select-option-label"
                            id="select-option"
                            value={selectedOption}
                            label="Select an Option"
                            onChange={handleOptionChange}
                        >
                            {options.map((option, index) => (
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
                        sx={{ marginTop: '1rem' }}
                    >
                        Submit
                    </Button>
                </Box>
            )}
            {showMap && (
                <>
                    <button className="reset-button" onClick={() => changePos()}>Reset</button>
                    <div id="map-container" ref={mapContainerRef} />
                </>
            )}
        </>
    );
}

export default App;
