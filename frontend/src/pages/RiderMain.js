//Create the initial layout
//Map of their location
//To and From + find drivers
import { Link } from 'react-router-dom';
import react from 'react';
import './App.css';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export const RiderMain = () => {
    return (
        <body>
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
                <li><Link to="/login" className='nav-button'>Log in</Link></li>
                <li><a href="#">Sign up</a></li>
                </ul>
            </div>
        </body>
    );
};