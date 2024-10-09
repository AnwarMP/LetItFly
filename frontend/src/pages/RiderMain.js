import { Link } from 'react-router-dom';
// import { useState, useEffect }  from 'react';
// import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import './App.css';
import './Rider.css';


//const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export const RiderMain = () => {
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
                    <button>Find Driver</button>
                </div>
                
            </div>
            <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12641.637409132061!2d-122.39722578496227!3d37.6160577524095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808f778c55555555%3A0xa4f25c571acded3f!2sSan%20Francisco%20International%20Airport!5e0!3m2!1sen!2sus!4v1728510592051!5m2!1sen!2sus"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
    </div> 
    );
};