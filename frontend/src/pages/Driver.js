import React from 'react';
import { Link } from 'react-router-dom';
import './Driver.css';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Geocoder } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css';

export const Driver = () => {
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const marker = useRef();
    const [, setMapLoaded] = useState(false);
    const [inputValue, setInputValue] = useState("");
    var currentLat = 0;
    var currentLong = 0;

    const currentPos = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                storePos
            );
    
        } else {
            console.log("This browser does not support geolocation");
        }
    };

    const storePos = (position) => {
        currentLat = position.coords.latitude;
        currentLong = position.coords.longitude;
        console.log("Current pos is " + currentLat + " and " + currentLong);
        mapRef.current.setCenter([currentLong, currentLat]);
        marker.current.setLngLat([mapRef.current.getCenter().lng, mapRef.current.getCenter().lat]);
    }



    useEffect(() => {
        mapboxgl.accessToken = process.env.REACT_APP_SECRET_MAP_KEY;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current, // Container
            center: [-121.92857174599622, 37.36353799938156], // Starting pos
            zoom: 14 // Starting zoom
        });

        marker.current = new mapboxgl.Marker()
            .setLngLat([mapRef.current.getCenter().lng, mapRef.current.getCenter().lat])
            .addTo(mapRef.current);
        
        mapRef.current.on("load", () => {
            setMapLoaded(true);
        });

        return () => {
            mapRef.current.remove();
        }
    }, []);



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
                    <button className='btn btn-primary btn-circle btn-lg' onClick={currentPos}>Start Work</button>
                    <div className='disclaimer-text'>Note: This will use your location</div><br/>
                    {/* This is a placeholder, replace with JS elements that get license from DB */}
                    <h6>License Plate: 0tst000</h6>
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