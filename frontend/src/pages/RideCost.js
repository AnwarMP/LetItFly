import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  getDistanceFromLatLngInMiles,
  calculateCost,
  createMap,
  getDirections,
} from "./CostCal"; // Import utility functions
import NavBar from "./NavBar";
import "./Rider.css"; // Import your updated CSS file

function RideCost() {
  const location = useLocation();
  const { pickupCoords, dropoffCoords, pickup, dropoff } = location.state || {};
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [cost, setCost] = useState(null);
  const mapContainerRef = useRef(null);

  // This would normally come from a global user state or context
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulate logged-in state

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const calculatedDistance = getDistanceFromLatLngInMiles(
        pickupCoords,
        dropoffCoords
      );
      const calculatedCost = calculateCost(calculatedDistance);

      setDistance(calculatedDistance);
      setCost(calculatedCost);

      // Create map and show directions
      const map = createMap(mapContainerRef.current, pickupCoords);
      getDirections(
        pickupCoords,
        dropoffCoords,
        map,
        (distance) => setDistance(parseFloat(distance)), // Ensure distance is a number
        (duration) => setDuration(parseFloat(duration)), // Ensure duration is a number
        setCost
      );
    }
  }, [pickupCoords, dropoffCoords]);

  const handleBookRide = () => {
    if (isLoggedIn) {
      alert("Ride booked successfully!");
    } else {
      alert("Please log in to book this ride.");
    }
  };

  return (
    <div className="rider-home">
      <NavBar />
      <div className="ride-details-container">
        {/* Ride Details Section */}
        <div className="ride-info">
          <h1>Your Ride Details</h1>
          <p>
            <strong>Pickup Location:</strong> {pickup || "Not provided"}
          </p>
          <p>
            <strong>Dropoff Location:</strong> {dropoff || "Not provided"}
          </p>
          <p>
            <strong>Distance:</strong>{" "}
            {distance !== null
              ? `${distance.toFixed(2)} miles`
              : "Calculating..."}
          </p>
          <p>
            <strong>Estimate Ride Length:</strong>{" "}
            {duration !== null
              ? `${duration.toFixed(0)} mins`
              : "Calculating..."}
          </p>
          <p>
            <strong>Estimated Cost:</strong>{" "}
            {cost !== null ? `$${cost}` : "Calculating..."}
          </p>

          {/* Show the "Book this Ride" button only if the user is logged in */}
          {isLoggedIn ? (
            <button className="btn btn-success" onClick={handleBookRide}>
              Book this Ride
            </button>
          ) : (
            <div className="auth-options">
              <p>Please log in to book this ride or create a new account.</p>
              <div className="auth-buttons">
                <button className="btn btn-primary">
                  <Link to="/login" className="auth-link">
                    Sign In
                  </Link>
                </button>
                <button className="btn btn-secondary">
                  <Link to="/signup" className="auth-link">
                    Create New Account
                  </Link>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Section */}
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}

export default RideCost;
