import mapboxgl from 'mapbox-gl'
import F35icon from '../assets/icons/outputF-35.png';
import F22icon from '../assets/icons/outputF-22.png';
import Q53icon from '../assets/icons/outputQ-53.png';
import SU57icon from '../assets/icons/outputSU-57.png';
import J20icon from '../assets/icons/outputJ-20.png';
import KN06icon from '../assets/icons/outputQ-53.png';
import PillBoxicon from '../assets/icons/outputPillBox.png';

function loadMapImage(map, name, url) {
    return new Promise((resolve, reject) => {
        map.current.loadImage(url, function (error, image) {
            if (error) reject(error);
            else {
                map.current.addImage(name, image, { sdf: true });
                resolve();
            }
        });
    });
}

export function generateMap(mapRef, mapContainerRef, initCenter, sources, radarRadius) {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VuZXJhbGc4cnUiLCJhIjoiY202am1iYXZ2MDJnZjJscG9qZTlxZ2V3MSJ9._h8vg764DgWQWvxy8WgpRQ'

    // Define the max bounds (expanded slightly to prevent zoom snapping)
    //const BOUNDS_PADDING = 0.1 // Increased to allow more movement
    const MAXBOUNDS = [
        [-80.45975, 26.43274],
        [-79.99789, 26.74565]
    ]

    mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/generalg8ru/cm6jr45m500d501qqgrko8yug",
        center: initCenter,  // Use fixed initial center
        bounds: MAXBOUNDS,    // Apply bounds restriction
    });

    mapRef.current.scrollZoom.disable();
    mapRef.current.doubleClickZoom.disable();
    mapRef.current.dragRotate.disable();
    mapRef.current.touchZoomRotate.disableRotation();
    mapRef.current.dragPan.disable();

    mapRef.current.on('load', async () => {

        mapRef.current.addSource('tracks', {
            type: 'geojson',
            data: sources[0]
        });
        mapRef.current.addSource('my-vehicle', {
            type: 'geojson',
            data: sources[1]
        });
        mapRef.current.addSource('synced-tracks', {
            type: 'geojson',
            data: sources[2]
        });
        mapRef.current.addSource('friendly-vehicle', {
            type: 'geojson',
            data: sources[3]
        });
        mapRef.current.addSource('friendly-pillbox', {
            type: 'geojson',
            data: sources[4]
        });

        const imagesToLoad = {
            "F-35": F35icon,
            "F-22": F22icon,
            "Q-53": Q53icon,
            "SU-57": SU57icon,
            "J-20": J20icon,
            "KN-06": KN06icon,
            "PillBox": PillBoxicon
        }

        try {
            await Promise.all(
                Object.entries(imagesToLoad).map(([name, url]) => loadMapImage(mapRef, name, url))
            );

            // Friendly Pillbox Radar
            mapRef.current.addLayer({
                id: 'pillbox-radar-track',
                type: 'line',
                source: 'friendly-pillbox',
                filter: ['==', '$type', 'LineString'], // Only select line features
                paint: {
                    'line-color': 'rgb(0, 150, 0)',
                    'line-width': 4,
                    'line-emissive-strength': 1
                }
            });

            //Friendly Tracks layer
            mapRef.current.addLayer({
                id: 'synced_tracks_layer',
                type: 'circle',
                source: 'synced-tracks',
                paint: {
                    'circle-radius': 4,
                    "circle-emissive-strength": 1,
                    'circle-color': 'rgb(54, 199, 210)',
                    'circle-opacity': 1
                }
            });

            //Radar scanned Tracks layer
            mapRef.current.addLayer({
                id: 'tracks_layer',
                type: 'circle',
                source: 'tracks',
                paint: {
                    'circle-radius': 5,
                    "circle-emissive-strength": 1,
                    'circle-color': 'rgb(0, 255, 0)',
                    'circle-opacity': 1,
                },
            });

            //Friendly PillBox radar visual layer
            mapRef.current.addLayer({
                id: 'friendly_pillbox_radar_layer',
                type: 'circle',
                source: 'friendly-pillbox',
                filter: ['==', '$type', 'Point'], // Only select point features
                paint: {
                    'circle-radius': 0,
                    'circle-stroke-width': ["*", ["get", "radar_radius", ["get", "vehicleData"]], 45],
                    "circle-emissive-strength": 1,
                    'circle-stroke-opacity': 0.07,
                    'circle-stroke-color': 'rgb(255, 85, 0)',
                }
            });

            //User vehicle radar visual layer
            mapRef.current.addLayer({
                id: 'my_vehicle_radar_layer',
                type: 'circle',
                source: 'my-vehicle',
                paint: {
                    'circle-radius': 0,
                    'circle-stroke-width': (radarRadius * 45),
                    "circle-emissive-strength": 1,
                    'circle-stroke-opacity': 0.1,
                    'circle-stroke-color': 'rgba(255, 0, 0, 1)',
                }
            });

            //Friendly's vehicle radar visual layer
            mapRef.current.addLayer({
                id: 'friendly_vehicle_radar_layer',
                type: 'circle',
                source: 'friendly-vehicle',
                paint: {
                    'circle-radius': 0,
                    'circle-stroke-width': ["*", ["get", "radar_radius", ["get", "vehicleData"]], 45],
                    "circle-emissive-strength": 1,
                    'circle-stroke-opacity': 0.2,
                    'circle-stroke-color': 'rgb(145, 0, 249)',
                }
            });

            //Friendly PillBox layer
            mapRef.current.addLayer({
                id: 'friendly_pillbox_icon_layer',
                type: 'symbol',
                source: 'friendly-pillbox',
                filter: ['==', '$type', 'Point'], // Only select point features
                layout: {
                    'icon-image': ["get", "type", ['get', 'vehicleData']],
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                },
                paint: {
                    'icon-color': 'rgb(255, 85, 0)',
                    'icon-emissive-strength': 1,
                }
            })

            //User vehicle layer
            mapRef.current.addLayer({
                id: 'my_vehicle_icon_layer',
                type: 'symbol',
                source: 'my-vehicle',
                layout: {
                    'icon-image': ["get", "id", ["get", "vehicleData"]],
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                },
                paint: {
                    'icon-color': 'rgb(255, 0, 0)',
                    'icon-emissive-strength': 1,
                }
            });

            //Friendly vehicle layer
            mapRef.current.addLayer({
                id: 'friendly_vehicle_icon_layer',
                type: 'symbol',
                source: 'friendly-vehicle',
                layout: {
                    'icon-image': ["get", "id", ["get", "vehicleData"]]
                },
                paint: {
                    'icon-color': 'rgb(145, 0, 249)',
                    'icon-emissive-strength': 1,
                }
            });
        } catch (error) {
            console.error(error);
        }
    });

    return () => {
        mapRef.current.remove()
    }
}