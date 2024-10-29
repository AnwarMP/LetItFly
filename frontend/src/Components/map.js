import './map.css';
import { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'

export const Map = ({location, pickupLocation, dropoffLocation, showDirections, setShowDirections}) =>{
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const directionsRef = useRef();

    useEffect(() => {
        mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: location, // Starting pos from SJC
            zoom: 14 // Starting zoom
        });

        //controls to navigate zoom in/out and turn map.
        const nav = new mapboxgl.NavigationControl();
        mapRef.current.addControl(nav, 'top-left');

        // Initialize directions and add to map
        directionsRef.current = new MapboxDirections({
            accessToken: mapboxgl.accessToken,
            unit: 'imperial',
            profile: 'mapbox/driving-traffic',
            interactive: false,
            controls: {
                instructions: false,
    
            }
        });
        mapRef.current.addControl(directionsRef.current, 'top-left');

        // Wait for the map to load
        mapRef.current.on('load', () => {
            // Add a layer to display a circle at the user's location
            mapRef.current.addLayer({
                id: 'user-location-circle',
                type: 'circle',
                source: {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: location, // User's location
                        },
                    },
                },
                paint: {
                    'circle-radius': 10, // Adjust circle size
                    'circle-color': '#7D0DC3', // Circle color (purple)
                    'circle-stroke-width': 2, // Stroke width for the circle
                    'circle-stroke-color': '#ffffff', // Circle stroke color
                    'circle-opacity': 0.7, // Adjust circle opacity
                },
            });
        });

    
        return () => {
            mapRef.current.remove()
        }
    }, [location])

    // Update directions when 'showDirections' becomes true
    useEffect(() => {
        if (directionsRef.current && showDirections) {
            directionsRef.current.setOrigin(pickupLocation || '');
            directionsRef.current.setDestination(dropoffLocation || '');
            // Optionally reset 'showDirections' after updating directions
            if (setShowDirections) {
                setShowDirections(false);
            }
        }
    }, [showDirections, pickupLocation, dropoffLocation, setShowDirections]);

    return (
        <>
        <div id='map-container' ref={mapContainerRef}/>
        </>
    )
}

export default Map;