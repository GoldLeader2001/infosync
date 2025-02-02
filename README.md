# InfoSync (DataLink clone)

## Basic Description
The problem involves building a small-scale clone of the Air Force's data link system in React. Each browser instance represents an "aircraft" placed randomly within a limited map zone. Each aircraft has its own detection radius for identifying "tracks"—which are either static "enemies" or other users—within that radius. If only one user is active, they will only be able to view tracks within their own radius. However, if multiple users are present, the system will display all detected tracks across all users.

The goal is to minimize the backend's involvement, relying on a lightweight system where the "track" data is sent directly to a database. Other aircraft (browser instances) will then retrieve the raw data and visualize the tracks on the map, similar to how modern aircraft use onboard systems to process positional information.

## Our Techstack
* React.js frontend (this will generate the map and do all the logic) [Docs](https://legacy.reactjs.org/docs/getting-started.html)
* Firebase Firestore (this is where all the raw data gathered by the "aircraft" will be sent) [Docs](https://firebase.google.com/docs/firestore)
* Mapbox GL (this is the map generation and interaction tool we will be using) [Docs](https://docs.mapbox.com/#maps)

## TODOS
* Make sure visible radar corresponds to detection radius algorithm's range (this will probably be easiest to do if we get movement working, and will be more important if we add additional aircraft)
* add functionality for arrowkey based movement (movement will have to update the radar) [possible doc](https://docs.mapbox.com/mapbox-gl-js/example/live-geojson/)
* add factions (this will be expanded upon)
* add different layer symbols depending on vehicle type
* fix layers overlapping and changing the colors of pings (local radar pings should take priority)
* fix naming inconsistencies
* work on code readability


