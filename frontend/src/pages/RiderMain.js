import { Link } from 'react-router-dom';
// import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import './App.css';
import './Rider.css';
import Map from '../Components/map';
import { useState, useEffect } from 'react';
// Note: Corrected the import statement for jwtDecode
import { jwtDecode } from 'jwt-decode';

//const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const defaultLocation = [-121.92857174599622, 37.36353799938156]; // Default location (SJC)

export const RiderMain = () => {
    const [location, setLocation] = useState(defaultLocation);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [showDirections, setShowDirections] = useState(false);
    const [loading, setLoading] = useState(false);
    const [driverData, setDriverData] = useState(null);
    const [numPassengers, setNumPassengers] = useState(''); // Changed to empty string
    const [allowRideshare, setAllowRideshare] = useState(false);
    const token = localStorage.getItem('token');
    let rider_id;
    let intervalID;

    //Define the list of airports**
    const airports = [
        "San Francisco International Airport",
        "San José International Airport",
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

    // Updated validation logic
    const canFindDriver = hasPickup && hasDropoff && atLeastOneAirport && differentLocations && hasNumPassengers;

    // Update showDirections whenever pickup or dropoff location changes
    useEffect(() => {
        if (hasPickup && hasDropoff && differentLocations) {
            // Optionally implement a debounce here
            setShowDirections(true);
        } else {
            setShowDirections(false);
        }
    }, [pickupLocation, dropoffLocation, differentLocations]);

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
    
    const handleRide = async () => {
        setLoading(true); // Set loading to true to show the loading animation

        if (token) {
            try {
                const decoded = jwtDecode(token);
                rider_id = decoded.userId;
            } catch (error) {
                console.error("Could not decode JWT token");
            }
        } else {
            console.error("No JWT token found");
        }

        try {
            console.log("pickup_location: " + pickupLocation);
            console.log("dropoff_location: " + dropoffLocation);
            console.log("num_passengers: " + numPassengers);
            console.log("allow_ridershare: " + allowRideshare);
            const response = await fetch('http://localhost:3000/store-rider-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rider_id: rider_id, 
                    pickup_location: pickupLocation, 
                    dropoff_location: dropoffLocation,
                    num_passengers: numPassengers,
                    allow_rideshare: allowRideshare
                }),
              }
            );
            if (response.ok)
              console.log("Stored success");
        } catch (error) {
            console.error('Store rider location information failed', error);
        }
        intervalID = setInterval(async () => {awaitDriver();}, 1000);
    };

    const awaitDriver = async () => {
        try {
            const response = await fetch(`http://localhost:3000/await-driver?rider_id=${rider_id}`);
            const data = await response.json();
            if (response.ok) {
                // For checking if the response was empty
                if (!(Object.keys(data).length === 0)) {
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
            const response = await fetch(`http://localhost:3000/delete-ride-pair?rider_id=${rider_id}`);
            const data = await response.json();
            if (response.ok) {
                console.log(data);
            }
        } catch (error) {
            console.error("Could not delete", error);
            
        }
    }

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
                        <p><strong>Name:</strong> {driverData.name}</p>
                        <p><strong>Car:</strong> {driverData.car}</p>
                        <p><strong>License Plate:</strong> {driverData.license_plate}</p>
                        <h5>{driverData.name} is on their way!</h5>
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
                                <option value="San José International Airport" />
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
                                <option value="San José International Airport" />
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
                            {[...Array(8)].map((_, i) => (
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
                        {/* Display error message if validation fails */}
                        {!canFindDriver && (
                            <div className="error-message">
                                Please ensure you have filled all required fields and are going to or from one of the 3 given Bay Area airports.
                            </div>
                        )}
                    </div>
                    
                )}
                <div className="driver-button find-driver-button"> 
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
            />
        </div>
    </div> 
    );
};
