import React from 'react';
import { Link } from 'react-router-dom';
import './Driver.css';
import Map from '../Components/map';
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Geocoder } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css';


const defaultLocation = [-121.92857174599622, 37.36353799938156];

export const Driver = () => {
    const [location, setLocation] = useState(defaultLocation);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [showDirections, setShowDirections] = useState(false);
    const [loading, setLoading] = useState(false);
    const [driverData, setDriverData] = useState(null);
    var pendingRides = [];
    var currentLocation = [];

    useEffect(() => {
        const getLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newLocation = [
                            position.coords.longitude,
                            position.coords.latitude
                        ];
                        currentLocation = newLocation;
                        console.log("Location updated to:", newLocation); 
                        setPickupLocation(newLocation);
                        setLocation(newLocation);
                    },
                    (error) => {
                        console.log(`Error in fetching location: ${error.message}`);
                        alert(`Error in fetching location: ${error.message}`);
                    }
                );
            } else {
                console.log("Geolocation is not supported by this browser.");
                alert("Geolocation is not supported by this browser.");
            }
        };

        getLocation();
    }, []); // Empty dependency array to run only on mount


    const handleShowDirections = () => {
        setShowDirections(true);
    };

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
                            // sendDriverResponse(num);
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
              setDropoffLocation(riderDetails);
              handleShowDirections();
            } else {
              alert(data.message);
            }

        } catch (error) {
            console.error('Fetch riders failed', error);
          alert('Fetching riders failed. Please try again.');
        }
    }

    // const acceptRide = async (riderID) => {
    //     // event.preventDefault();
    //     try {
    //         const response = await fetch(`http://localhost:3000/store-session?riderID=${riderID}&driverID=1&fare=0`);

    //         const data = await response.json();
    //         if (response.ok) {

    //         } else {
    //           alert(data.message);
    //         }

    //     } catch (error) {
    //         console.error('Accepting ride failed', error);
    //       alert('Accepting ride failed. Please try again.');
    //     }
    // }

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
                    <button className='btn btn-primary btn-circle btn-lg' onClick={fetchRiders}>Start Work</button>


                    <div className='disclaimer-text'>Note: This will use your location</div><br/>


                    {/* <button className='btn btn-primary btn-circle btn-lg' onClick={getDirection}>Get path from current map center to SJC</button> */}


                    {/* This is a placeholder, replace with JS elements that get license from DB */}
                    <h6>License Plate: 0tst000</h6>

                    <ul id='riders'></ul>


                </div>      
                <div className='right-column'>
                    <Map 
                    location={location}                 
                    pickupLocation={pickupLocation}
                    dropoffLocation={dropoffLocation} 
                    showDirections={showDirections}
                    setShowDirections={setShowDirections}
                    />
                    {/* <div className='map-container' ref={mapContainerRef}> */}
                    {/* </div> */}
                </div>   

            </div>
        </body>
    );
}