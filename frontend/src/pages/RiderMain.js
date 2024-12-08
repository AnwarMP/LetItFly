import { Link } from 'react-router-dom';
// import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import './App.css';
import './Rider.css';
import Map from '../Components/map';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
// Note: Corrected the import statement for jwtDecode
import { jwtDecode } from 'jwt-decode';

const defaultLocation = [-121.92857174599622, 37.36353799938156]; // Default location (SJC)

export const RiderMain = () => {
    const { user, role } = useSelector(state => state.auth);
    const [location, setLocation] = useState(defaultLocation);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [showDirections, setShowDirections] = useState(false);
    const [loading, setLoading] = useState(false);
    const [driverData, setDriverData] = useState(null);
    const [numPassengers, setNumPassengers] = useState(''); // Changed to empty string
    const [allowRideshare, setAllowRideshare] = useState(false);
    const token = sessionStorage.getItem('token');
    const [sessionData, setSessionData] = useState(null); // State to hold session data
    const [routeInfo, setRouteInfo] = useState({ duration: 0, distance: 0 }); // Added routeInfo state
    const [riderId, setRiderId] = useState('');
    const [isSecondRider, setIsSecondRider] = useState(false);
    const [hasSecondRider, setHasSecondRider] = useState(false);
    let intervalID;

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setRiderId(decoded.userId);
            } catch (error) {
                console.error("Could not decode JWT token");
            }
        } else {
            console.error("No JWT token found");
        }
    })

    const addressRegex = /^[^,]+,\s*[^,]+,\s*[^,]+,\s*\d{5}$/;

    //Define the list of airports**
    const airports = [
        "San Francisco International Airport",
        "(SJC) San José Mineta InternationalAirport",
        "Oakland International Airport"
    ];

    //Function to check if a location is an airport**
    const isAirport = (location) => airports.includes(location);

    // Check that both pickup and dropoff locations have input
    const hasPickup = pickupLocation !== '';
    const hasDropoff = dropoffLocation !== '';

    // Check if the pickup and dropoff locations are airports
    const isPickupAirport = isAirport(pickupLocation);
    const isDropoffAirport = isAirport(dropoffLocation);

    // Ensure at least one location is an airport
    const atLeastOneAirport = isPickupAirport || isDropoffAirport;

    // Ensure the pickup and dropoff locations are not the same
    const differentLocations = pickupLocation !== dropoffLocation;

    // Check if number of passengers is selected
    const hasNumPassengers = numPassengers !== '';

    // Add validation function
    const isValidAddress = (location) => {
        return isAirport(location) || addressRegex.test(location);
    };

    // Updated validation logic
    const canFindDriver = hasPickup && hasDropoff && atLeastOneAirport && differentLocations && 
    hasNumPassengers && 
    (isValidAddress(pickupLocation) && isValidAddress(dropoffLocation));

    // Utility function to calculate fare
    const calculateFare = (distance) => {
        const perMileRate = 1.75; // Set dollar rate per mile
        const freeMiles = 2; // First 2 miles are free
        const minimumFare = 15; // Minimum fare
        let rideshareDiscount = 0;

        // Calculate chargeable distance
        const chargeableDistance = Math.max(0, distance - freeMiles);

        if(allowRideshare) rideshareDiscount = 10;

        // Calculate total fare
        const fare = Math.max(minimumFare, (chargeableDistance * perMileRate) - rideshareDiscount);

        return fare.toFixed(2); // Return fare as a string with 2 decimal places
    };

    // Update showDirections whenever pickup or dropoff location changes
    useEffect(() => {
        if (hasPickup && hasDropoff && differentLocations) {
            // Optionally implement a debounce here
            setShowDirections(true);
        } else {
            setShowDirections(false);
        }
    }, [pickupLocation, dropoffLocation, differentLocations]);

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLocation = [
                        position.coords.longitude,
                        position.coords.latitude
                    ];
                    console.log("Location updated to:", newLocation); 
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
    }, []); // Empty dependency array to run only on mount
    
    const handleRide = async () => {
        setLoading(true); // Set loading to true to show the loading animation

        try {
            console.log("pickup_location: " + pickupLocation);
            console.log("dropoff_location: " + dropoffLocation);
            console.log("num_passengers: " + numPassengers);
            console.log("allow_ridershare: " + allowRideshare);
            const fare = await calculateFare(routeInfo.distance);
            const response = await fetch('http://localhost:3000/store-rider-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rider_id: riderId, 
                    rider_name: user?.first_name,
                    pickup_location: pickupLocation, 
                    dropoff_location: dropoffLocation,
                    num_passengers: numPassengers,
                    allow_rideshare: allowRideshare,
                    est_time: routeInfo.duration,
                    fare: fare
                }),
              }
            );
            if (response.ok)
              console.log("Stored success");
        } catch (error) {
            console.error('Store rider location information failed', error);
        }
        console.log("Waiting for driver");
        intervalID = setInterval(async () => {awaitDriver();}, 1000);
    };

    const awaitDriver = async () => {
        try {
            console.log("Awaiting driver, riderId: " + riderId);
            const response = await fetch(`http://localhost:3000/await-driver?rider_id=${riderId}`);
            const data = await response.json();
            console.log("Data, " + data);
            if (response.ok) {
                // For checking if the response was empty
                if (!(Object.keys(data).length === 0)) {
                    console.log("Driver found");
                    clearInterval(intervalID);
                    fetchDriver(data.driver_id);
                    const wait = await showDriverDetails(data.driver_id);
                    const wait2 = await deleteRidePair();
                    setLoading(false);
                }
            } else {
                console.log("not ok");
            }
        } catch (error) {
            console.error('Await driver failed', error);
        }
    }

    const fetchDriver = async (driver_id) => {
        try {
            const response = await fetch(`http://localhost:3000/get-driver-location?driver_id=${driver_id}`);
            const data = await response.json();
            if (response.ok) {
                setPickupLocation(data);
                setDropoffLocation(pickupLocation);
            }
        } catch (error) {
            console.error('Fetch driver error', error);
        }
    }


    const showDriverDetails = async (driver_id) => {
        try {
            const response = await fetch(`http://localhost:3000/get-driver?driverID=${driver_id}`); // Adjust the URL/port if necessary
            if (!response.ok) {
                throw new Error('Failed to fetch driver data');
            }
            const data = await response.json();
            setDriverData(data);

            console.log('Driver Data:', data);
        } catch (error) {
            console.error('Error fetching driver data:', error);
        }
    }

    const deleteRidePair = async () => {
        try {
            const response = await fetch(`http://localhost:3000/delete-ride-pair?rider_id=${riderId}`);
            const data = await response.json();
            if (response.ok) {
                console.log(data);
            }
        } catch (error) {
            console.error("Could not delete", error);
            
        }
    }

    // Function to fetch session data
    const fetchSessionData = async () => {
        console.log("Fetching session data: " + riderId + " " + driverData.driver_id);
        if (driverData) {
            try {
                const response = await fetch(`http://localhost:3000/get-session?rider_id=${riderId}&driver_id=${driverData.driver_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setSessionData(data); // Update session data state
                    console.log("Fetched session data!: ", { ...data});
                    console.log("allow_rideshare value:", data.allow_rideshare);
                    console.log("allow_rideshare type:", typeof data.allow_rideshare);

                    if (data.confirm_pickup.toLowerCase() === "false" && data.is_second_rider !== undefined ) {
                        setPickupLocation(driverData.location);
                        setDropoffLocation(data.pickupLocation);
                    }

                    //Handle if rider, themselves, has been added to ride (they are the second rider)
                    if (data.is_second_rider !== undefined && data.is_second_rider === "true") {
                        setIsSecondRider(true);
                        console.log("Second rider: ", data.first_rider_pickup_location, data.pickup_location)
                        if(data.confirm_pickup.toLowerCase() === "false"){
                            setPickupLocation(data.first_rider_pickup_location);
                            setDropoffLocation(data.pickup_location)
                        }
                    }

                    if (data.confirm_pickup.toLowerCase() === "true") {
                        setPickupLocation(data.pickup_location);
                        setDropoffLocation(data.dropoff_location);
                    }
                    
                    //handle second rider if it exist (Handling the first rider ui)
                    if (data.second_rider_confirm_pickup === undefined) {
                        console.log("Second rider confirm pickup key is undefined.");
                    } else if (data.second_rider_confirm_pickup.toLowerCase() === "false") {
                        setHasSecondRider(true);
                        setPickupLocation(data.pickupLocation);
                        setDropoffLocation(data.second_rider_pickup_location);
                    } else if (data.second_rider_confirm_pickup.toLowerCase() === "true") {
                        setPickupLocation(data.second_rider_pickup_location);
                        setDropoffLocation(data.dropoff_location);
                    }

                    //Handle dropoff
                    if (data.confirm_dropoff.toLowerCase() === "true") {
                        console.log("Confirmed dropped off");
                        //reset rider ui
                        setDriverData(null);
                        setPickupLocation('');
                        setDropoffLocation('');
                        setNumPassengers('');
                        setAllowRideshare(false);

                        setIsSecondRider(false);

                        setHasSecondRider(false);

                        getLocation(); // Update the user's current location

                        //Maybe here can update SQL database to record the session information for rider/driver transaction history.

                        //Do this only after transaction recored
                        //Delete related redis keys
                        deleteRideKeys(riderId, driverData.driver_id);

                    }

                } else {
                    console.error('Failed to fetch session data');
                }
            } catch (error) {
                console.error('Error fetching session data:', error);
            }
        }
    };

    // useEffect to fetch session data every second when driverData is set
    useEffect(() => {
        let intervalID;
        if (driverData) {
            intervalID = setInterval(() => {
                fetchSessionData();
            }, 1000);

            // Clean up the interval on unmount or when dependencies change
            return () => clearInterval(intervalID);
        }
    }, [driverData]);

    const deleteRideKeys = async (riderId, driverId) => {
        try {
            const response = await fetch('http://localhost:3000/delete-ride-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keys: [
                        `rider:${riderId}`,
                        `session:rider:${riderId}:driver:${driverId}`,
                        `driver:${driverId}`
                    ]
                })
            });
    
            if (response.ok) {
                console.log('Ride keys deleted successfully');
            } else {
                console.error('Failed to delete ride keys');
            }
        } catch (error) {
            console.error('Error deleting ride keys:', error);
        }
    };

    return (
    <div>    

        <div className="rider-ui">
            <div className="rider-nav-sidebar">
                {loading ? (
                    // Display loading animation and "Finding a driver" message
                    <div className="loading-container">
                        <div className="spinner"></div> {/* Add spinner animation */}
                        <p>Finding a driver...</p>
                    </div>
                ) 
                :driverData ? (
                    // Display driver information if driverData is not null
                <div className="driver-info">
                <h3>Your Driver</h3>
                <div className="driver-details">
                    <p><strong>Name:</strong> {driverData.name}</p>
                    <p><strong>Car:</strong> {driverData.car}</p>
                    <p><strong>License Plate:</strong> {driverData.license_plate}</p>
                </div>

                {/* Display session data */}
                {sessionData && (
                    <div className="session-info">
                    <h3>Your Ride</h3>
                    <p><strong>Pickup Location:</strong> {sessionData.pickup_location}</p>
                    <p><strong>Dropoff Location:</strong> {sessionData.dropoff_location}</p>
                    <p><strong>Rideshare:</strong> {allowRideshare ? 'Enabled' : 'Disabled'}</p>
                    <p><strong>Fare (USD):</strong> {sessionData.fare}</p>
                    {/* Add more fields as needed */}
                    </div>
                )}

                {sessionData && (
                    <div className="eta-info">
                        {isSecondRider && sessionData.confirm_pickup.toLowerCase() === "false" ? (
                            <>
                                <h5>Joining an existing ride.</h5>
                                <h5>
                                    {driverData.name} is <span className="bold">{routeInfo.duration} minutes</span> away!
                                </h5>
                            </>
                        ) : sessionData.confirm_pickup.toLowerCase() === "false" ? (
                            <h5>
                                {driverData.name} is <span className="bold">{routeInfo.duration} minutes</span> away!
                            </h5>
                        ) : hasSecondRider && sessionData.second_rider_confirm_pickup.toLowerCase() === "false" ?(
                            <>
                                <h5>
                                    Another Rider has joined your ride! Picking them up now.
                                </h5>
                                <h5>
                                    ETA: <span className="bold">{routeInfo.duration} minutes</span>
                                </h5>
                            </>
                        ) : (
                            <h5>
                                ETA: <span className="bold">{routeInfo.duration} minutes</span>
                            </h5>
                        )}
                    </div>
                )}
                </div>

                ) 
                : (
                    // Default UI if no driverData is available
                    <div className="top-section">
                        <div className="from-textbox">
                            <input
                                list="pickup-locations"
                                type="text"
                                placeholder="Pickup Location"
                                className="from-input"
                                value={pickupLocation || ''}
                                onChange={(e) => {
                                    setPickupLocation(e.target.value);
                                }}
                            />
                            <datalist id="pickup-locations">
                                <option value="San Francisco International Airport" />
                                {/* This is the closet I can get to the San Jose Airport without Mapbox confusion */}
                                <option value="(SJC) San José Mineta InternationalAirport" />
                                <option value="Oakland International Airport" />
                            </datalist>
                        </div>

                        <div className="to-textbox">
                            <input
                                list="dropoff-locations"
                                type="text"
                                placeholder="Where to?"
                                className="to-input"
                                value={dropoffLocation || ''}
                                onChange={(e) => {
                                    setDropoffLocation(e.target.value);
                                }}
                            />
                            <datalist id="dropoff-locations">
                                <option value="San Francisco International Airport" />
                                <option value="(SJC) San José Mineta InternationalAirport" />
                                <option value="Oakland International Airport" />
                            </datalist>
                        </div>
                        {/* Number of Passengers Dropdown */}
                        <div className="num-passengers">
                        <select
                            id="num-passengers-select"
                            className="input-field"
                            value={numPassengers}
                            onChange={(e) => setNumPassengers(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Number of Passengers
                            </option>
                            {[...Array(4)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                        </div>
                        {/* Allow Rideshare Toggle */}
                        <div className="allow-rideshare">
                            <label htmlFor="allow-rideshare-checkbox" className="checkbox-label">
                                Share Ride With Others
                                <input
                                    type="checkbox"
                                    id="allow-rideshare-checkbox"
                                    checked={allowRideshare}
                                    onChange={(e) => setAllowRideshare(e.target.checked)}
                                />
                            </label>
                        </div>
                    </div>
                    
                )}
                <div className="driver-button find-driver-button"> 
                    {/* Display error message if validation fails */}
                    {!driverData && !canFindDriver && !loading && (
                        <div className="error-message">
                                    Please ensure:<br></br>
                                    - You have selected number of passengers
                                    <br></br>
                                    - At least one location is one of the 3 given Bay Area airports
                                    <br></br>
                                    - Non-airport addresses follow format: Street, City, State, ZIP
                        </div>
                    )}
                    {!driverData && !loading && canFindDriver && routeInfo.duration > 0 && routeInfo.distance > 0 && (
                        <div className="route-info">
                            <p>Estimated Time: <span className="bold">{routeInfo.duration} minutes</span></p>
                            <p>Total Distance: <span className="bold">{routeInfo.distance} miles</span></p>
                            <p>Estimated Fare: <span className="bold">${calculateFare(routeInfo.distance)}</span></p>
                        </div>
                    )}
                    {!driverData && !loading && ( //Remove Find Driver button once you select 'Find Driver'
                        <button onClick={handleRide} disabled={!canFindDriver}>Find Driver</button>
                    )}
                </div>
            </div>

            <Map 
                location={location}                 
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation} 
                showDirections={showDirections}
                setShowDirections={setShowDirections}
                setRouteInfo={setRouteInfo}
            />
        </div>
    </div> 
    );
};
