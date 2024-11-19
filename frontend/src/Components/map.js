import './map.css';
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';

export const Map = ({
    location,
    pickupLocation,
    dropoffLocation,
    showDirections,
    setShowDirections,
    setRouteInfo, // Added prop to pass route info back to parent
}) => {
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const directionsRef = useRef();

    useEffect(() => {
        mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

        // Initialize the map
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: location,
            zoom: 14,
        });

        // Add navigation controls
        const nav = new mapboxgl.NavigationControl();
        mapRef.current.addControl(nav, 'top-left');

        // Initialize directions control but don't add it yet
        directionsRef.current = new MapboxDirections({
            accessToken: mapboxgl.accessToken,
            unit: 'imperial',
            profile: 'mapbox/driving-traffic',
            interactive: false,
            controls: {
                instructions: false,
            },
        });
        mapRef.current.addControl(directionsRef.current, 'top-left');

        mapRef.current.on('load', () => {
            // Add traffic layer
            mapRef.current.addLayer({
                id: 'traffic',
                type: 'line',
                source: {
                    type: 'vector',
                    url: 'mapbox://mapbox.mapbox-traffic-v1',
                },
                'source-layer': 'traffic',
                paint: {
                    'line-width': 2,
                    'line-color': [
                        'case',
                        ['==', ['get', 'congestion'], 'low'], '#00ff00',
                        ['==', ['get', 'congestion'], 'moderate'], '#ffcc00',
                        ['==', ['get', 'congestion'], 'heavy'], '#ff0000',
                        '#000000',
                    ],
                },
            });

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
                            coordinates: location,
                        },
                    },
                },
                paint: {
                    'circle-radius': 10,
                    'circle-color': '#7D0DC3',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.7,
                },
            });
        });

        return () => {
            mapRef.current.remove();
        };
    }, [location]);

    useEffect(() => {
        if (directionsRef.current && showDirections) {
            // Set origin and destination
            directionsRef.current.setOrigin(pickupLocation || '');
            directionsRef.current.setDestination(dropoffLocation || '');

            // Listen for route events to get duration and distance
            directionsRef.current.on('route', (event) => {
                if (event.route && event.route.length > 0) {
                    const route = event.route[0];
                    const duration = route.duration; // in seconds
                    const distance = route.distance; // in meters

                    // Convert duration to minutes and distance to miles
                    const durationMinutes = Math.round(duration / 60);
                    const distanceMiles = (distance / 1609.34).toFixed(2);

                    // Update parent component with route info
                    if (setRouteInfo) {
                        setRouteInfo({
                            duration: durationMinutes,
                            distance: distanceMiles,
                        });
                    }
                }
            });

            // Optionally reset 'showDirections' after updating directions
            if (setShowDirections) {
                setShowDirections(false);
            }
        }
    }, [
        showDirections,
        pickupLocation,
        dropoffLocation,
        setShowDirections,
        setRouteInfo,
    ]);

    return (
        <>
            <div id='map-container' ref={mapContainerRef} />
        </>
    );
};

export default Map;