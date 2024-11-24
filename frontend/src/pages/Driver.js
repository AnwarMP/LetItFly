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
    const [postgresRideId, setPostgresRideId] = useState(null);
    const [rideShareEnabled, setRideShareEnabled] = useState(false);
    const [rideshareMatches, setRideshareMatches] = useState([]);
    const [ridesharePollingInterval, setRidesharePollingInterval] = useState(null);


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

    const startRidesharePolling = () => {
        // Clear any existing interval
        if (ridesharePollingInterval) {
          clearInterval(ridesharePollingInterval);
        }
      
        // Start new polling interval
        const intervalId = setInterval(async () => {
          try {
            const response = await fetch(
              `http://localhost:3000/get-rideshare-matches?dropoff_location=${encodeURIComponent(riderData.dropoff_location)}`
            );
      
            if (response.ok) {
              const matches = await response.json();
              console.log('Rideshare matches found:', matches);
              setRideshareMatches(matches);
            } else {
              console.error('Failed to fetch rideshare matches');
            }
          } catch (error) {
            console.error('Error fetching rideshare matches:', error);
          }
        }, 3000); // Poll every 3 seconds
      
        setRidesharePollingInterval(intervalId);
      };

    useEffect(() => {
        getLocation();
        fetchUserProfile();

        // Cleanup function
        return () => {
            if (ridesharePollingInterval) {
            clearInterval(ridesharePollingInterval);
            }
        };
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
            console.log("Fetching available riders...");
            const response = await fetch(
                `http://localhost:3000/driver-pending-rides?driver_location=${currentPos.join(',')}`
            );
    
            const data = await response.json();
            if (response.ok) {
                pendingRides = data; // This is now an array of ride objects
                console.log('Pending riders fetch successful!');
                console.log('Found', pendingRides.length, 'potential rides');

                // Reset cachedRides at the start of the function
                cachedRides = [];
    
                // Clear existing rides display
                document.getElementById('riders').innerHTML = '';
    
                // Display each ride
                for (const ride of pendingRides) {
                    const rideData = ride.rideData;
                    const duration = ride.duration;
    
                    // Extract rider ID from rideKey (e.g., "rider:123" -> "123")
                    const riderId = ride.rideKey.split(':')[1];
    
                    if (!cachedRides.includes(riderId)) {
                        document.getElementById('riders').innerHTML += `
                            <li id="${pendingRides.length - 1}">
                                <button class="btn-search bottom-border" id="rider_${riderId}">
                                    <strong>Rider:</strong> ${rideData.rider_name}
                                    <br/>
                                    <strong>Pickup Location:</strong> ${rideData.pickup_location}
                                    <br/>
                                    <strong>Dropoff Location:</strong> ${rideData.dropoff_location}
                                    <br/>
                                    <strong>Pickup Time:</strong> ${duration} minutes
                                    <br/>
                                    <strong>Estimated Fare:</strong> $${rideData.fare}
                                </button>
                            </li>`;
    
                        cachedRides.push(riderId);
                    }
                }
    
                // Add click handlers
                pendingRides.forEach(ride => {
                    const riderId = ride.rideKey.split(':')[1];
                    const button = document.getElementById(`rider_${riderId}`);
                    
                    if (button) {
                        button.addEventListener("click", function () {
                            clearInterval(intervalID);
                            setDestinationTo(riderId);
                            storeDriverLocation();
                            sendDriverResponse(riderId);
                            acceptRide(riderId);
                            deleteRiderEntry(riderId);
                            cachedRides = [];
                        });
                    }
                });
    
            } else {
                console.log('Error fetching rides:', data.message);
            }
        } catch (error) {
            console.error('Fetch riders failed:', error);
            console.log('Error details:', error.message);
        }
    };




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
        try {
            // First fetch rider details and store in Redis session
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
            };

            console.log("Session details: ", sessionDetails);
            
            // Store session in Redis
            const sessionResponse = await fetch('http://localhost:3000/store-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionDetails),
            });

            console.log("Session response: ", sessionResponse);
    
            if (!sessionResponse.ok) {
                throw new Error('Failed to store session');
            }
    
            // Create a new ride in PostgreSQL
            const createResponse = await fetch('http://localhost:3000/api/payments/rides', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rider_id_given: rider_id,
                    pickup_location: rider_pickup_location,
                    dropoff_location: rider_dropoff_location,
                    estimated_fare: rider_fare,
                    num_passengers: 1,
                }),
            });
    
            if (!createResponse.ok) {
                const createError = await createResponse.text();
                console.error('Create ride error:', createError);
                throw new Error(`Failed to create ride: ${createError}`);
            }
    
            const createData = await createResponse.json();
            const rideId = createData.ride.id;
            setPostgresRideId(rideId);
    
            // Accept the ride as the driver
            console.log('Attempting to accept ride with ID:', rideId);
            console.log('Using token:', token);
            
            const acceptResponse = await fetch(
                `http://localhost:3000/api/payments/rides/${rideId}/accept`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
    
            if (!acceptResponse.ok) {
                const acceptError = await acceptResponse.text();
                console.error('Accept ride error:', acceptError);
                throw new Error(`Failed to accept ride: ${acceptError}`);
            }
    
            const acceptData = await acceptResponse.json();
            console.log('Accept ride response:', acceptData);
    
            setSessionStart(true);
            console.log("Ride created and accepted successfully");
    
        } catch (error) {
            console.error('Accepting ride failed:', error);
            alert(`Failed to accept ride: ${error.message}`);
        }
    };

    const grabRiderDetails = async (rider_id) => {
        try {
            const response = await fetch(`http://localhost:3000/get-rider-info?rider_id=${rider_id}`);

            const data = await response.json();
            console.log("Recieved rider data: ", data);

            if (response.ok) {
                // pendingRides = data;
                rider_name = data.rider_name;
                rider_dropoff_location = data.dropoff_location;
                rider_pickup_location = data.pickup_location;
                rider_start = data.start_time;
                rider_fare = data.fare;
                setRideShareEnabled(data.allow_rideshare); // setting rideshare as enabled or not
            } else {
                console.log(data.message);
            }

            return data;

        } catch (error) {
            console.error('Fetch riders failed', error);
            console.log('Fetching riders failed for /get-rider-info. Please try again.');
        }
    }

    const confirmPickup = async () => {
        const wait = await getTokenID();
        
        try {

            if (!postgresRideId) {
                throw new Error('No ride ID found');
            }
    
            // Start the ride in PostgreSQL
            const paymentResponse = await fetch(
                `http://localhost:3000/api/payments/rides/${postgresRideId}/start`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            if (!paymentResponse.ok) {
                throw new Error('Failed to start ride');
            }

            // Update session in Redis
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

                // Start rideshare polling if rideshare is enabled
                if (rideShareEnabled) {
                    console.log('Starting rideshare polling...');
                    startRidesharePolling();
                }
            }
        } catch (error) {
            console.error('Fetch riders failed', error);
            alert('Fetching riders failed. Please try again.');
        }
    }

    const confirmDropoff = async () => {
        try {
            if (!postgresRideId) {
                throw new Error('No ride ID found');
            }

            // End the polling
            if (ridesharePollingInterval) {
                clearInterval(ridesharePollingInterval);
                setRidesharePollingInterval(null);
            }
    
            // First complete PostgreSQL transaction
            console.log('Completing ride in PostgreSQL:', {
                rideId: postgresRideId,
                fare: riderData.fare,
                riderId: riderData.rider_id
            });
    
            const response = await fetch(
                `http://localhost:3000/api/payments/rides/${postgresRideId}/complete`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        final_fare: parseFloat(riderData.fare),
                        rider_id: riderData.rider_id
                    }),
                }
            );
    
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to complete ride: ${errorData}`);
            }
    
            // Then update Redis
            console.log('Updating Redis session:', {
                driverId: user.id,
                riderId: riderData.rider_id
            });
    
            const redisResponse = await fetch('http://localhost:3000/update-session-dropoff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driver_id:  user.id,
                    rider_id: riderData.rider_id,
                    confirm_dropoff: 'true',
                    end_time: Date.now(),
                }),
            });
    
            if (!redisResponse.ok) {
                const redisError = await redisResponse.text();
                console.error('Redis update failed:', redisError);
                // Don't throw here, continue with cleanup
            } else {
                console.log('Redis session updated successfully');
            }
    
            // Update UI and clean up
            document.getElementById('completeDisplay').innerHTML = 
                `Ride completed! Payment of $${riderData.fare} processed.`;
            
            setPickupConfirm(false);
            getLocation();
            getCurrentPos();
   
    
        } catch (error) {
            console.error('Error in confirmDropoff:', error);
            alert(`Failed to complete ride: ${error.message}`);
        }
    };

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
                            {rideShareEnabled ? ( <p><strong>Ride Share Enabled</strong></p> ) : ( <p><strong>Ride Share Disabled</strong></p> )}
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
                            {rideShareEnabled ? (
                                    <>
                                        <p><strong>Ride Share Enabled</strong></p>
                                        {rideshareMatches.length > 0 ? (
                                            <Card className='drive-margin'>
                                                <CardHeader className="card-header">
                                                    <CardTitle className="card-title">Available Rideshare Matches:</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className='remove-indent'>
                                                        {rideshareMatches.map((match, index) => (
                                                            <li key={`${match.rideKey}-${index}`}>
                                                                <button 
                                                                    className="btn-search bottom-border"
                                                                    style={{ width: '100%', margin: '5px 0' }}
                                                                >
                                                                    <strong>Rider:</strong> {match.rideData.rider_name}
                                                                    <br/>
                                                                    <strong>Pickup Location:</strong> {match.rideData.pickup_location}
                                                                    <br/>
                                                                    <strong>Fare:</strong> ${match.rideData.fare}
                                                                    <br/>
                                                                    <strong>Passengers:</strong> {match.rideData.num_passengers}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <p><em>No rideshare matches available</em></p>
                                        )}
                                    </>
                                ) : (
                                    <p><strong>Ride Share Disabled</strong></p>
                                )}
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