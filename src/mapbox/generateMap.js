import mapboxgl from 'mapbox-gl'
import jeticon from '../assets/icons/output.png';

export function generateMap(mapRef, mapContainerRef, initCenter, sources) {
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
        mapRef.current.addSource('my-aircraft', {
            type: 'geojson',
            data: sources[1]
        });
        mapRef.current.addSource('syncedTracks', {
            type: 'geojson',
            data: sources[2]
        });
        mapRef.current.addSource('friendlies', {
            type: 'geojson',
            data: sources[3]
        });

        mapRef.current.loadImage(
            jeticon,
            (error, image) => {
                if (error) throw error;

                mapRef.current.addImage('aircraft', image, { sdf: true });

                mapRef.current.addLayer({
                    id: 'my_aircraft_icon-layer',
                    type: 'symbol',
                    source: 'my-aircraft',
                    layout: {
                        'icon-image': 'aircraft',
                        'icon-rotate': -90
                    },
                    paint: {
                        'icon-color': 'rgb(255, 0, 0)',
                        'icon-emissive-strength': 1,
                    },
                    emissive_strength: 1
                });
            }
        );

        mapRef.current.loadImage(
            jeticon,
            (error, image) => {
                if (error) throw error;

                mapRef.current.addImage('friendlyaircraft', image, { sdf: true });

                mapRef.current.addLayer({
                    id: 'friendly_aircraft_icon-layer',
                    type: 'symbol',
                    source: 'friendlies',
                    layout: {
                        'icon-image': 'friendlyaircraft',
                        'icon-rotate': -90
                    },
                    paint: {
                        'icon-color': 'rgb(145, 0, 249)',
                        'icon-emissive-strength': 1,
                    },
                    emissive_strength: 1
                });
            }
        )

        mapRef.current.addLayer({
            id: 'tracks_layer',
            type: 'circle',
            source: 'tracks',
            paint: {
                'circle-radius': 4,
                'circle-stroke-width': 2,
                "circle-emissive-strength": 1,
                'circle-color': 'green',
                'circle-blur': 0.5,
                'circle-opacity': 0.8,
                'circle-stroke-color': 'rgba(0, 255, 0, 1)',
            },
            emissive_strength: 1
        });

        mapRef.current.addLayer({
            id: 'synced_tracks_layer',
            type: 'circle',
            source: 'syncedTracks',
            paint: {
                'circle-radius': 4,
                'circle-stroke-width': 2,
                "circle-emissive-strength": 1,
                'circle-color': 'rgb(54, 199, 210)',
                'circle-blur': 0.5,
                'circle-opacity': 0.8,
                'circle-stroke-color': 'rgb(54, 199, 210)',
            },
            emissive_strength: 1
        });

        mapRef.current.addLayer({
            id: 'my_aircraft_layer',
            type: 'circle',
            source: 'my-aircraft',
            paint: {
                'circle-radius': 0,
                'circle-stroke-width': 100,
                "circle-emissive-strength": 1,
                'circle-stroke-opacity': 0.1,
                'circle-stroke-color': 'rgba(255, 0, 0, 1)',
            }
        });

        mapRef.current.addLayer({
            id: 'friendly_aircraft_layer',
            type: 'circle',
            source: 'friendlies',
            paint: {
                'circle-radius': 0,
                'circle-stroke-width': 100,
                "circle-emissive-strength": 1,
                'circle-stroke-opacity': 0.2,
                'circle-stroke-color': 'rgb(145, 0, 249)',
            }
        });

    });

    return () => {
        mapRef.current.remove()
    }
}