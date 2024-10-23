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
                <div className="from-textbox">
                    <input list="pickup-locations" type="text" placeholder="Pickup Location" className="from-input" />
                    <datalist id="pickup-locations">
                        <option value="San Francisco International Airport" />
                        <option value="San Jose Mineta International Airport" />
                        <option value="Oakland International Airport" />
                    </datalist>
                </div>
                <div className="to-textbox">
                <input list="dropoff-locations" type="text" placeholder="Where to?" className="to-input" />
                    <datalist id="dropoff-locations">
                        <option value="San Francisco International Airport" />
                        <option value="San Jose Mineta International Airport" />
                        <option value="Oakland International Airport" />
                    </datalist>
                </div>
                <div className="driver-button">
                    <button>Show Directions</button>
                </div>
                <div className="driver-button">
                    <button>Find Driver</button>
                </div>
            </div>
            <Map location={location} />
            {/* <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12641.637409132061!2d-122.39722578496227!3d37.6160577524095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808f778c55555555%3A0xa4f25c571acded3f!2sSan%20Francisco%20International%20Airport!5e0!3m2!1sen!2sus!4v1728510592051!5m2!1sen!2sus"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            ></iframe> */}
        </div>
    </div> 
    );
};