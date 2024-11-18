import React from 'react';
import './Driver.css';
import Map from '../Components/map';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import 'mapbox-gl/dist/mapbox-gl.css';
import { jwtDecode } from 'jwt-decode';


const defaultLocation = [-121.92857174599622, 37.36353799938156];


export const Driver = () => {
    const { isAuthenticated, user, role } = useSelector(state => state.auth);
    const [location, setLocation] = useState(defaultLocation);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [showDirections, setShowDirections] = useState(false);
    const token = localStorage.getItem('token');
    const [riderData, setRiderData] = useState(null);
    const [sessionStage0, setStage0] = useState(null);
    const [sessionPickupStage, setPickupConfirm] = useState(null);

    let driver_id;
    let pendingRides = [];
    var currentPos = [];
    let intervalID;
    // For grabbing rider chosen details
    let rider_pickup_location;
    let rider_dropoff_location;
    let rider_start;


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

    const getTokenID = async () => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                driver_id = decoded.userId;
            } catch (error) {
                console.error("Could not decode JWT token");
            }
        } else {
            console.error("No JWT token found");
        }
    }

    const grabPosAndRiders = () => {
        getTokenID();
        getCurrentPos();
        loopFetch();
    }
    
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
        intervalID = setInterval(async () => {fetchRiders();}, 1000);
    }

    // Fetches riders currently waiting
    const fetchRiders = async () => {
        try {
            // Keep trying to fetch available riders every second until the driver confirms a rider they want
            console.log("try to fetch riders");
            const response = await fetch('http://localhost:3000/driver-pending-rides');

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
                        <button class="btn btn-dark btn-circle animate-ping" id="rider_${i}">Rider ID: ${num}</button>
                    <li>`;
                }
                // Implements button functionality
                for (let i = 0; i < pendingRides.length; i++) {
                    let num = pendingRides[i].replace(/\D/g, '');
                    document.getElementById(`rider_${i}`).addEventListener("click",
                        function () {
                            clearInterval(intervalID);
                            setDestinationTo(num);
                            storeDriverLocation();
                            sendDriverResponse(num);
                            acceptRide(num);
                            deleteRiderEntry(num);
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

    const deleteRiderEntry = async (rider_id) => {
        try {
            const response = await fetch(`http://localhost:3000/delete-waiting-ride?rider_id=${rider_id}`);
            // const data = await response.json();
            if (response.ok) {
                console.log("Delete pending rider entry success");
            }
        } catch (error) {
            console.error("Could not delete pending rider entry", error);
        }
    }

    // On button select, set destination on map
    const setDestinationTo = async (rider_id) => {
        try {
            const response = await fetch(`http://localhost:3000/get-rider-location?rider_id=${rider_id}`);

            const data = await response.json();
            if (response.ok) {
                pendingRides = data;
                setRiderData(data);
                document.getElementById('riders').innerHTML = '';
                setDropoffLocation(pendingRides.pickup_location);
                handleShowDirections();
                // rider_confirm = true;
            } else {
                alert(data.message);
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
                driver_id: driver_id,
                current_location: `[${currentPos[0]}, ${currentPos[1]}]`,
                name: `${user?.first_name} ${user?.last_name}`,
                car: `2022 Toyota Camry`,                                   // Hard-coded car for now, fetch from db later
                license_plate: `1abc234`                                    // Hard-coded licence plate for now, fetch from db later
            };

            console.log("car " + user?.car_model);

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

    const sendDriverResponse = async (rider_id) => {
        try {
            const response = await fetch(`http://localhost:3000/wake-rider?rider_id=${rider_id}&driver_id=${driver_id}`);
            // const data = await response2.json();
            if (response.ok) {
                console.log('Wake works');
            }
        } catch (error) {
            console.error('Wake rider failed', error);
        }
    }

    const acceptRide = async (rider_id) => {
        // Waits for GET to fetch locations and time before creating session
        const riderResponse = await grabRiderDetails(rider_id);

        const sessionDetails = {
            rider_id: rider_id,
            driver_id: driver_id,
            pickup_location: rider_pickup_location, 
            dropoff_location: rider_dropoff_location, 
            confirm_pickup: 'false',
            confirm_dropoff: 'false',
            start_time: rider_start,
            end_time: 0,                    // 0 for now, need to implement time and fare
            fare: 0                         // 0 for now, need to implement time and fare
        }
        
        try {
            const response = await fetch(`http://localhost:3000/store-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionDetails),
              }
            );

            // const data = await response.json();
            if (response.ok) {
                console.log("Create and store session success");
                setStage0(true);
            } else {
            //   alert(data.message);
            }

        } catch (error) {
            console.error('Accepting ride failed', error);
        }
    }

    const grabRiderDetails = async (rider_id) => {
        try {
            const response = await fetch(`http://localhost:3000/get-rider-location?rider_id=${rider_id}`);

            const data = await response.json();
            if (response.ok) {
                pendingRides = data;
                rider_dropoff_location = pendingRides.dropoff_location;
                rider_pickup_location = pendingRides.pickup_location;
                rider_start = pendingRides.start_time;
            } else {
                alert(data.message);
            }

        } catch (error) {
            console.error('Fetch riders failed', error);
            alert('Fetching riders failed. Please try again.');
        }
    }

    const confirmPickup = async () => {
        const wait = await getTokenID();
        console.log(driver_id);
        console.log(riderData.rider_id);
        
        try {
            const response = await fetch(`http://localhost:3000/update-session-pickup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driver_id: driver_id,
                    rider_id: riderData.rider_id,
                    confirm_pickup: 'true'
                }),
              }
            );

            if (response.ok) {
                console.log("Confirm session for pickup good");
                setStage0(false);
                setPickupConfirm(true);
                setPickupLocation(riderData.pickup_location);
                setDropoffLocation(riderData.dropoff_location);
                setShowDirections(true);
            }
        } catch (error) {
            console.error('Fetch riders failed', error);
            alert('Fetching riders failed. Please try again.');
        }
    }

    return (
        <body>

            <div className='box-container'>
                <div className='left-column'>
                    {sessionStage0 ? (
                        <div className="rider-info">
                            <h3>Rider for Pickup</h3>
                            <p><strong>Rider's ID:</strong> {riderData.rider_id}</p>
                            <p><strong>Pickup Location:</strong> {riderData.pickup_location}</p>
                            <p><strong>Dropoff Location:</strong> {riderData.dropoff_location}</p>
                            <p><strong>Session Status:</strong> Awaiting Pickup</p>
                            <button className='btn btn-primary btn-circle btn-dark' onClick={confirmPickup}>Click to confirm pickup</button>
                        </div>
                    ):

                    sessionPickupStage ? (
                        <div className="rider-info">
                            <h3>Rider for Pickup</h3>
                            <p><strong>Rider's ID:</strong> {riderData.rider_id}</p>
                            <p><strong>Pickup Location:</strong> {riderData.pickup_location}</p>
                            <p><strong>Dropoff Location:</strong> {riderData.dropoff_location}</p>
                            <p><strong>Session Status:</strong> Driving to Dropoff</p>
                            <button className='btn btn-primary btn-circle btn-dark' onClick={confirmPickup}>Click to confirm dropoff</button>
                        </div>
                    ):

                    (
                        <div className='default-container text-center'>
                            <br/><br/><br/><br/><br/>
                            <img src='/default-profile.png' alt='profile-picture'></img><br/>
                            <span id='name-text'>{user?.first_name} {user?.last_name}</span><br/><br/>
                            <button className='btn btn-primary btn-circle btn-lg' onClick={grabPosAndRiders}>Start Work</button>
                            <div className='disclaimer-text'>Note: This will use your location</div><br/>
        
                            {/* This is a placeholder, replace with JS elements that get license from DB */}
                            <h6>License Plate: 0tst000</h6>
        
                            <ul id='riders'></ul>
                        </div>
                    )}


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