import React from 'react';
import { Link } from 'react-router-dom';
import './Driver.css';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Geocoder } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapBoxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'


export const Driver = () => {
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const markerRef = useRef();
    const routingRef = useRef();
    const [, setMapLoaded] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const sjcLatLong = [-121.92857174599622, 37.36353799938156];
    var currentLat = 0;
    var currentLong = 0;
    var pendingRides = [];

    const getDirection = () => {
        // Note: right now calling this more than once causes the route to change because the center
        // point on the map changes every time
        routingRef.current.setOrigin([mapRef.current.getCenter().lng, mapRef.current.getCenter().lat]);
        routingRef.current.setDestination(sjcLatLong);
    }

    const setDestinationTo = async (riderID) => {
        try {
            const response = await fetch('http://localhost:3000/get-rider-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                  },
                body: JSON.stringify({ riderID: riderID }),
            });

            const data = await response.json();
            if (response.ok) {
              pendingRides = data;
              alert('Fetch successful!');
              var riderDetails = data;
              console.log(riderDetails);
              document.getElementById('riders').innerHTML = '';
              routingRef.current.setOrigin([currentLong, currentLat]);
              routingRef.current.setDestination([riderDetails[0], riderDetails[1]]);
            } else {
              alert(data.message);
            }

        } catch (error) {
            console.error('Fetch riders failed', error);
          alert('Fetching riders failed. Please try again.');
        }
    }

    const currentPos = () => {
        // Checks if the browser and device has geolocation enabled 
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                updatePos
            );
        } else {
            console.log("This browser does not support geolocation");
        }
    };

    const updatePos = (position) => {
        currentLat = position.coords.latitude;
        currentLong = position.coords.longitude;

        // Debug Line: 
        // console.log("Current pos is " + currentLat + " and " + currentLong);

        // Update map and marker to be on center to current location
        mapRef.current.setCenter([currentLong, currentLat]);
        markerRef.current.setLngLat([mapRef.current.getCenter().lng, mapRef.current.getCenter().lat]);
    }


    useEffect(() => {
        mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current, // Container
            center: [-121.92857174599622, 37.36353799938156], // Starting pos from SJC
            zoom: 14 // Starting zoom
        });

        markerRef.current = new mapboxgl.Marker()
            .setLngLat([mapRef.current.getCenter().lng, mapRef.current.getCenter().lat])
            .addTo(mapRef.current);

            
        routingRef.current = new MapBoxDirections({
            accessToken: mapboxgl.accessToken,
            unit:'imperial',
            profile:'mapbox/driving-traffic',
            interactive: false,
            controls: {
                instructions: false,
    
            }
        });

        mapRef.current.on("load", () => {
            setMapLoaded(true);
            console.log("map loaded");
        });
            
        mapRef.current.addControl(routingRef.current);
        
        return () => {
            mapRef.current.remove();
        }
    }, []);


    const fetchRiders = async () => {
        try {
            const response = await fetch('http://localhost:3000/driver/rides', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                  },
            });

            const data = await response.json();
            if (response.ok) {
              pendingRides = data;
              alert('Fetch successful!');
              document.getElementById('riders').innerHTML = '';
              for (let i = 0; i < pendingRides.length; i++) {
                var num = pendingRides[i].replace(/\D/g, '');
                  document.getElementById('riders').innerHTML += 
                  `<li id="${pendingRides.length - 1}">
                    <button class="btn btn-dark btn-circle" id="rider_${i}">Rider ID: ${num}</button>
                  <li>`;
            }

            for (let i = 0; i < pendingRides.length; i++) {
                let num = pendingRides[i].replace(/\D/g, '');
                document.getElementById(`rider_${i}`).addEventListener("click", 
                    function() {
                        setDestinationTo(num);
                        // acceptRide(num);
                    });    
            }


            } else {
              alert(data.message);
            }

        } catch (error) {
            console.error('Fetch riders failed', error);
          alert('Fetching riders failed. Please try again.');
        }
    }

    const acceptRide = async (riderID) => {
        // event.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/store-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                  },
                body: JSON.stringify({ riderID: riderID, driverID: '100', fare: '0'}),
            });

            const data = await response.json();
            if (response.ok) {
              pendingRides = data;
              alert('Fetch successful!');

            } else {
              alert(data.message);
            }

        } catch (error) {
            console.error('Accepting ride failed', error);
          alert('Accepting ride failed. Please try again.');
        }
    }


    const grabPosAndRiders = () => {
        currentPos();
        fetchRiders();
    }


    return (
        <body>
            <div className="custom-nav">
                <div className="left-section">
                    <div className="logo">Let It Fly</div>
                        <ul>
                        <li><a href="#">Ride</a></li>
                        <li><a href="#">Drive</a></li>
                        <li><a href="#">About</a></li>
                        </ul>
                </div>
                <ul>
                    <li><Link to="/login" className='nav-button'>Log in</Link></li>
                    <li><Link to="/signup" className='nav-button'>Sign up</Link></li>
                </ul>
            </div>

            <div className='box-container'>
                <div className='left-column text-center'>
                <br/><br/><br/><br/><br/><br/><br/>
                    <img src = '/default-profile.png'></img><br/>
                    {/* This is a placeholder, replace with JS elements that get name from DB */}
                    <span id='name-text'>John Doe</span><br/><br/>
                    <button className='btn btn-primary btn-circle btn-lg' onClick={grabPosAndRiders}>Start Work</button>


                    <div className='disclaimer-text'>Note: This will use your location</div><br/>


                    <button className='btn btn-primary btn-circle btn-lg' onClick={getDirection}>Get path from current map center to SJC</button>


                    {/* This is a placeholder, replace with JS elements that get license from DB */}
                    <h6>License Plate: 0tst000</h6>

                    <ul id='riders'></ul>


                </div>      
                <div className='right-column'>
                    <Geocoder
                        accessToken={mapboxgl.accessToken}
                        map={mapRef.current}
                        mapboxgl={mapboxgl}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e);
                        }}
                    />

                    <div className='map-container' ref={mapContainerRef}>
                    </div>
                </div>   

            </div>
        </body>
    );
}