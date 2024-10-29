import { Link } from 'react-router-dom';
// import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import './App.css';
import './Rider.css';
import Map from '../Components/map';
import { useState, useEffect } from 'react';

//const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const defaultLocation = [-121.92857174599622, 37.36353799938156]; // Default location (SJC)

export const RiderMain = () => {
    const [location, setLocation] = useState(defaultLocation);
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [showDirections, setShowDirections] = useState(false);
       
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

    return (
    <div>    
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
            <li><a href="#">Account</a></li>
            </ul>
        </div>
        <div className="rider-ui">
            <div className="rider-nav-sidebar">
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
                            <option value="San Jose Mineta International Airport" />
                            <option value="Oakland International Airport" />
                        </datalist>
                    </div>
                    <div className="driver-button">
                        <button onClick={handleShowDirections}>Show Directions</button>
                    </div>
                </div>
                <div className="driver-button find-driver-button">
                    <button>Find Driver</button>
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