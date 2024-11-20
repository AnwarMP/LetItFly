import React from 'react';
import './Driver.css';
import Map from '../Components/map';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/Card';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import 'mapbox-gl/dist/mapbox-gl.css';
import { jwtDecode } from 'jwt-decode';


const defaultLocation = [-121.92857174599622, 37.36353799938156];


export const Driver = () => {
    const { user, role } = useSelector(state => state.auth);
    const [location, setLocation] = useState(defaultLocation);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [showDirections, setShowDirections] = useState(false);
    const token = localStorage.getItem('token');
    const [riderData, setRiderData] = useState(null);
    const [sessionStart, setSessionStart] = useState(null);
    const [sessionPickupStage, setPickupConfirm] = useState(null);
    const [driverData, setDriverData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        home_address: '',
        car_model: '',
        car_license_plate: ''
      });
    let driver_id;
    let pendingRides = [];
    let cachedRides = [];
    var currentPos = [];
    let intervalID;
    // For grabbing rider chosen details
    let rider_name;
    let rider_pickup_location;
    let rider_dropoff_location;
    let rider_start;
    let rider_fare;

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

    useEffect(() => {
        getLocation();
        fetchUserProfile();
    }, []); // Empty dependency array to run only on mount

    const fetchUserProfile = async () => {
        try {
          const response = await fetch('http://localhost:3000/auth/profile', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const data = await response.json();
          if (response.ok) {
            setDriverData(data.user);
          } else {
            console.error('Failed to fetch profile data');
          }
        } catch (error) {
          console.error('Error loading profile');
        }
      };


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
    
    const getCurrentPos = () => {
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
        intervalID = setInterval(async () => {fetchRiders();}, 2000);
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
                // document.getElementById('riders').innerHTML = '';
                console.log('length is ' + pendingRides.length);
                // Goes through list, grabs rider IDs, and displays them in list of buttons
                for (let i = 0; i < pendingRides.length; i++) {
                    var num = pendingRides[i].replace(/\D/g, '');
                    if (!cachedRides.includes(num)) {
                        const wait = await grabRiderDetails(num);
                        document.getElementById('riders').innerHTML +=
                        `<li id="${pendingRides.length - 1}">
                            <button class="btn-search bottom-border" id="rider_${num}">
                                <strong>Rider:</strong> ${rider_name}
                                <br/>
                                <strong>Pickup Location:</strong> ${rider_pickup_location}
                                <br/>
                                <strong>Dropoff Location:</strong> ${rider_dropoff_location}
                                <br/>
                                <strong>Estimated Fare:</strong> $${rider_fare}
                            </button>
                        <li>`;
                    }
                    console.log("cached rides " + cachedRides);
                }
                // Implements button functionality
                for (let i = 0; i < pendingRides.length; i++) {
                    let num = pendingRides[i].replace(/\D/g, '');
                    if (!cachedRides.includes(num)) {
                        document.getElementById(`rider_${num}`).addEventListener("click",
                            function () {
                                clearInterval(intervalID);
                                setDestinationTo(num);
                                storeDriverLocation();
                                sendDriverResponse(num);
                                acceptRide(num);
                                deleteRiderEntry(num);
                                cachedRides = [];
                            }
                        );
                        cachedRides.push(num);
                    }
                }
            } else {
                console.log(data.message);
            }
    } catch (error) {
            console.error('Fetch riders failed', error);
            // alert('Fetching riders failed. Please try again.');
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
            // alert('Fetching riders failed. Please try again.');
        }
    }

    const storeDriverLocation = async () => {
        
        try {
            getCurrentPos();

            const driver_data = {
                driver_id: driver_id,
                current_location: `[${currentPos[0]}, ${currentPos[1]}]`,
                name: `${user?.first_name} ${user?.last_name}`,
                car: `${driverData?.car_model}`,
                license_plate: `${driverData?.car_license_plate}`
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
            end_time: 0,
            fare: rider_fare,
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
                setSessionStart(true);
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
                // pendingRides = data;
                rider_name = data.rider_name;
                rider_dropoff_location = data.dropoff_location;
                rider_pickup_location = data.pickup_location;
                rider_start = data.start_time;
                rider_fare = data.fare;
            } else {
                console.log(data.message);
            }

        } catch (error) {
            console.error('Fetch riders failed', error);
            console.log('Fetching riders failed for get-rider-location. Please try again.');
        }
    }

    const confirmPickup = async () => {
        const wait = await getTokenID();
        
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
                setSessionStart(false);
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

    const confirmDropoff = async () => {
        const wait = await getTokenID();

        try {
            const response = await fetch('http://localhost:3000/update-session-dropoff', {
                method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driver_id: driver_id,
                        rider_id: riderData.rider_id,
                        confirm_dropoff: 'true',
                        end_time: Date.now(),
                    }),
                }
            );
            
            if (response.ok) {
                // Set up a display for how much driver makes from fares, then returns back to old screen
                document.getElementById('completeDisplay').innerHTML += `Thank you for your service!`
                setTimeout(function() {setPickupConfirm(false);}, 5000);
            }


        } catch (error) {
            console.error("Bad update on session dropoff", error)
        }

        getLocation(); //Updated map to just user location once confirmed dropoff is true
        getCurrentPos();
    }

    return (
        <body>

            <div className='box-container'>
                <div className='left-column'>
                    {sessionStart ? (
                        <div className="rider-info drive-margin">
                            <h3>Rider for Pickup</h3>
                            <p><strong>Rider's Name:</strong> {riderData.rider_name}</p>
                            <p><strong>Pickup Location:</strong> {riderData.pickup_location}</p>
                            <p><strong>Dropoff Location:</strong> {riderData.dropoff_location}</p>
                            <p><strong>Session Status:</strong> Awaiting Pickup</p>
                            <p><strong>Fare:</strong> ${riderData.fare} </p>
                            <button className='btn btn-circle btn-outline-dark drive-margin' onClick={confirmPickup}>Click to confirm pickup</button>
                        </div>
                    ):

                    sessionPickupStage ? (
                        <div className="rider-info drive-margin">
                            <h3>Rider for Pickup</h3>
                            <p><strong>Rider's Name:</strong> {riderData.rider_name}</p>
                            <p><strong>Pickup Location:</strong> {riderData.pickup_location}</p>
                            <p><strong>Dropoff Location:</strong> {riderData.dropoff_location}</p>
                            <p><strong>Session Status:</strong> Driving to Dropoff</p>
                            <p><strong>Fare:</strong> ${riderData.fare} </p>
                            <button className='btn btn-circle btn-outline-dark drive-margin' onClick={confirmDropoff}>Click to confirm dropoff</button>

                            <p id='completeDisplay'><strong></strong></p>
                        </div>
                    ):

                    (
                        <div className='default-container text-center remove-indent'>
                            <br/><br/><br/><br/><br/>
                            <img src='/default-profile.png' alt='profile-picture'></img><br/>
                            <span id='name-text'>{user?.first_name} {user?.last_name}</span><br/><br/>
                            <button className='btn btn-circle btn-lg btn-outline-dark' onClick={grabPosAndRiders}>Start Work</button>
                            <div className='disclaimer-text'><strong>Note:</strong> This will use your location</div><br/>
        
                            <h6>License Plate: {driverData.car_license_plate}</h6>
                            <Card className='drive-margin'>
                                <CardHeader className="card-header">
                                    <CardTitle className="card-title">Rider Queue:</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul id='riders' className='remove-indent'></ul>
                                </CardContent>
                            </Card>
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