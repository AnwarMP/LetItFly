import { Link } from 'react-router-dom';
// import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import './App.css';
import './Rider.css';
import Map from '../Components/map';
import { useState, useEffect } from 'react';
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
    const token = localStorage.getItem('token');
    let rider_id;
    let intervalID;

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

    const handleShowDirections = () => {
        setShowDirections(true);
    };
    
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
            console.log("pickup_location " + pickupLocation);
            console.log("dropoff_location " + dropoffLocation);
            const response = await fetch('http://localhost:3000/store-rider-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({rider_id: rider_id, pickup_location: pickupLocation, dropoff_location: dropoffLocation}),
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
                handleShowDirections();
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

            // // Update locations to render map of Driver going to Rider
            // if (data.longitude && data.latitude) {
            //     // Set the original pickup location as the dropoff location
            //     setDropoffLocation(pickupLocation); // Previous pickup location

            //     // Set driver's location as the new pickup location
            //     setPickupLocation([data.longitude, data.latitude]);

            //     // Set show directions as true to rerender map
            //     handleShowDirections();

            //     console.log("Updated new driver-rider map");
            // }

            console.log('Driver Data:', data);
        } catch (error) {
            console.error('Error fetching driver data:', error);
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
                                onChange={(e) => setPickupLocation(e.target.value)}
                            />
                            <datalist id="pickup-locations">
                                <option value="San Francisco International Airport" />
                                <option value="San Jose Mineta International Airport" />
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
                                onChange={(e) => setDropoffLocation(e.target.value)}
                            />
                            <datalist id="dropoff-locations">
                                <option value="San Francisco International Airport" />
                                {/* For some reason, adding Mineta to the SJ Interantional Airport name sends the route down to Costa Rica,
                                    so removing the Mineta in the name description for now */}
                                <option value="San Jose International Airport" />
                                <option value="Oakland International Airport" />
                            </datalist>
                        </div>
                        <div className="driver-button">
                            <button onClick={handleShowDirections}>Show Directions</button>
                        </div>
                    </div>
                )}
                <div className="driver-button find-driver-button"> 
                    {!driverData && !loading && ( //Remove Find Driver button once you select 'Find Driver'
                        <button onClick={handleRide}>Find Driver</button>
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