# [InfoSync](https://infosync-81e06.firebaseapp.com/) (DataLink clone)

## Basic Description
The problem involves building a small-scale clone of the Air Force's data link system in React. Each browser instance represents an "aircraft" placed randomly within a limited map zone. Each aircraft has its own detection radius for identifying "tracks"—which are either static "enemies" or other users—within that radius. If only one user is active, they will only be able to view tracks within their own radius. However, if multiple users are present, the system will display all detected tracks across all users.

The goal is to minimize the backend's involvement, relying on a lightweight system where the "track" data is sent directly to a database. Other aircraft (browser instances) will then retrieve the raw data and visualize the tracks on the map, similar to how modern aircraft use onboard systems to process positional information.

## Our Techstack
* React.js frontend (this will generate the map and do all the logic) [Docs](https://legacy.reactjs.org/docs/getting-started.html)
* Firebase Firestore (this is where all the raw data gathered by the "aircraft" will be sent) [Docs](https://firebase.google.com/docs/firestore)
* Mapbox GL (this is the map generation and interaction tool we will be using) [Docs](https://docs.mapbox.com/#maps)

## TODOS
* Make sure visible radar corresponds to detection radius algorithm's range (this will probably be easiest to do if we get movement working, and will be more important if we add additional aircraft)
    * Once we have proper movement setup we will be able to gauge the accuracy of our radii calculations
* Add functionality for arrowkey based movement (movement will have to update the radar) [possible doc](https://docs.mapbox.com/mapbox-gl-js/example/live-geojson/)
    * This shouldnt be too difficult as we should be able to reuse some of the code that randomly assigns the vehicles coordinates
    * This will not move smoothly (right now) this will move the vehicle in steps, the distance of those steps are determined by the vehicles speed
* Add factions (this will be expanded upon)
    * There will be two factions (US and NDEF) each faction will have it's own subset of available vehicles the faction and vehicle will be chosen on the entry form
    * You will only be able to see pings from your own faction
    * Detected enemy aircraft will show up as pings not an aircraft (Yet, we may implement a functionality to simulate more realistic radar)
    * Static "pillboxes" will belong to a mix of both the US and NDEF (they will also have bearing radar with a large radius, this will not detect enemy "pillboxes")
* Add different layer symbols depending on vehicle type
    * This is slightly complex as you cannot just use a standard PNG you have to convert it to a SDF enabled image first so MapBox can use it
    * Each vehicle should have a unique symbol that resembles it shape (i.e. F-35 vs Q-53)
* Work on code readability
    * Possibly break up the code into seperate easier to digest files
    * Modify Repeated variable names
    * Remove repeated code
    * Better comments
* Style the entry form properly
    * Form should style the whole screen
    * The contrast of the text needs to be increased in order to increase readability

## BUGS
* ~~Pillbox breaks the removal of pings for some reason~~
* ~~Sometimes overlapping pings aren't removed (Solution: radarscan on change?)~~
* ~~Synced pings and radar ping layers are overlapping and changing the colors of pings (local radar pings should take priority)~~
* Fix naming inconsistencies (example: aircraft vs airCraft)


