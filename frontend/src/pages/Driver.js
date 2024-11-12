import React from 'react';
import './Driver.css';
import Map from '../Components/map';
import { useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';


const defaultLocation = [-121.92857174599622, 37.36353799938156];

export const Driver = () => {
    const [location, setLocation] = useState(defaultLocation);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [showDirections, setShowDirections] = useState(false);
    let pendingRides = [];
    var currentPos = [];
    let rider_confirm = false;
    let intID;

    useEffect(() => {
        const getLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newLocation = [
                            position.coords.longitude,
                            position.coords.latitude
                        ];
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

    const getCurrentPos = async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                updatePos
            );
        } else {
            console.log("This browser does not support geolocation");
        }
    }

    const updatePos = (position) => {

        currentPos = [position.coords.longitude, position.coords.latitude];

    }

    const loopFetch = async () => {
        intID = setInterval(async () => {
            fetchRiders();  
        }, 1000);
        // while (rider_confirm === false) {
        //     console.log('waut');    
        // }
    }


    // Fetches riders currently waiting
    const fetchRiders = async () => {
        try {
            // Keep trying to fetch available riders every second until the driver confirms a rider they want
            console.log("try to fetch riders");
            const response = await fetch('http://localhost:3000/driver/rides');

            const data = await response.json();
            if (response.ok) {
                pendingRides = data;
                console.log('Pending riders fetch good!');
                document.getElementById('riders').innerHTML = '';
                // Goes through list, grabs rider IDs, and displays them in list of buttons
                for (let i = 0; i < pendingRides.length; i++) {
                    var num = pendingRides[i].replace(/\D/g, '');
                    document.getElementById('riders').innerHTML +=
                    `<li id="${pendingRides.length - 1}">
                        <button class="btn btn-dark btn-circle" id="rider_${i}">Rider ID: ${num}</button>
                    <li>`;
                }
                // Implements button functionality
                for (let i = 0; i < pendingRides.length; i++) {
                    let num = pendingRides[i].replace(/\D/g, '');
                    document.getElementById(`rider_${i}`).addEventListener("click",
                        function () {
                            setDestinationTo(num);
                            storeDriverLocation();
                            sendDriverResponse(num);
                            clearInterval(intID);
                        });
                }
            } else {
                console.log(data.message);
            }
    } catch (error) {
            console.error('Fetch riders failed', error);
            alert('Fetching riders failed. Please try again.');
        }
    }

    const storeDriverLocation = async () => {
        
        try {
            getCurrentPos();
            const driver_data = {
                driver_id: 1,                                       // Hard-coded driver_id for now, fetch from db later
                current_location: [currentPos[0], currentPos[1]],
                name: 'John Doe',                                   // Hard-coded name for now, fetch from db later
                car: '2006 Toyota Hilux',                           // Hard-coded car for now, fetch from db later
                license_plate: '1abc234'                            // Hard-coded licence plate for now, fetch from db later
            };
            const response = await fetch('http://localhost:3000/store-driver-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(driver_data),
              }
            );
            if (response.ok) {
                console.log('Stored driver location success');
            }
        } catch (error) {
            console.error('Store driver failed', error);
        }
    }

    const sendDriverResponse = async (riderID) => {
        try {
            const response = await fetch(`http://localhost:3000/wake-rider?rider_id=${riderID}&driver_id=1`);
            // const data = await response2.json();
            if (response.ok) {
                console.log('Wake works');
            }
        } catch (error) {
            console.error('Wake rider failed', error);
        }
    }

    const grabPosAndRiders = () => {
        getCurrentPos();
        loopFetch();
    }



    // On button select, set destination on map
    const setDestinationTo = async (riderID) => {
        try {
            const response = await fetch(`http://localhost:3000/get-rider-location?rider_id=${riderID}`);

            const data = await response.json();
            if (response.ok) {
                pendingRides = data;
                alert('Fetch successful!');
                var riderDetails = data;
                console.log(riderDetails);
                document.getElementById('riders').innerHTML = '';
                setDropoffLocation(riderDetails);
                handleShowDirections();
                rider_confirm = true;
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

            <div className='box-container'>
                <div className='left-column text-center'>
                    <br/><br/><br/><br/><br/><br/><br/>
                    <img src='/default-profile.png' alt='profile-picture'></img><br/>
                    {/* This is a placeholder, replace with JS elements that get name from DB */}
                    <span id='name-text'>John Doe</span><br/><br/>
                    <button className='btn btn-primary btn-circle btn-lg' onClick={grabPosAndRiders}>Start Work</button>


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