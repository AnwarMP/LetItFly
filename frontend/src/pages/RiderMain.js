//Create the initial layout
//Map of their location
//To and From + find drivers
import { Link } from 'react-router-dom';
// import { useState, useEffect }  from 'react';
// import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import './App.css';


//const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Default latitude and longitude if cannot get rider's location
// Set to SF
// const defaultLatitude = 37.7749;
// const defaultLongitude = -122.4194; 

// const containerStyle = {
//     width: '100%',
//     height: '400px',
//   };

// function getUserLocation(setLat, setLong) {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//             (position) => {
//                 setLat(position.coords.latitude);
//                 setLong(position.coords.longitude);
//             },
//             (error) => {
//                 console.error("Error fetching location: ", error);
//             }
//         );
//     } else {
//         console.error("Geolocation is not supported by this browser.");
//     }
// }

export const RiderMain = () => {
    // const [riderLatitude, setLat] = useState(defaultLatitude);
    // const [riderLongitude, setLong] = useState(defaultLongitude);

    // Use useEffect to fetch the user's location when the component mounts
    // Default is set to default lat & longitude;
    // useEffect(() => {
    //     getUserLocation(setLat, setLong);
    // }, []);


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


        {/* <div className="map-container">
            {riderLatitude && riderLongitude ? (
                <LoadScript googleMapsApiKey={MAPS_API_KEY}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{ lat: riderLatitude, lng: riderLongitude }}
                    zoom={15}
                >
                    <Marker position={{ lat: riderLatitude, lng: riderLongitude }} />
                </GoogleMap>
                </LoadScript>
            ) : (
                <p>Fetching location...</p>
            )}
        </div> */}

    </div> 
    );
};