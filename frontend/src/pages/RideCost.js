import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  getDistanceFromLatLngInMiles,
  calculateCost,
  createMap,
  getDirections,
} from "./MapUtil"; // Import utility functions

function RideCost() {
  const location = useLocation();
  const { pickupCoords, dropoffCoords, pickup, dropoff } = location.state || {};
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [cost, setCost] = useState(null); // Ensure cost starts as null or number
  const mapContainerRef = useRef(null);

  // Safely calculate distance, duration, and cost and show directions on the map
  useEffect(() => {
    if (pickupCoords && dropoffCoords && mapContainerRef.current) {
      const calculatedDistance = getDistanceFromLatLngInMiles(
        pickupCoords,
        dropoffCoords
      );

      // Ensure cost is calculated as a number
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
        (calculatedCost) => setCost(parseFloat(calculatedCost)) // Ensure cost is a number
      );
    }
  }, [pickupCoords, dropoffCoords]);

  return (
    <div className="rider-home">
      <h1>Your Ride Details</h1>
      <div>
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
          <strong>Duration:</strong>{" "}
          {duration !== null ? `${duration.toFixed(0)} mins` : "Calculating..."}
        </p>
        <p>
          <strong>Estimated Cost:</strong>{" "}
          {/* Ensure cost is a number before calling toFixed */}
          {typeof cost === "number" ? `$${cost.toFixed(2)}` : "Calculating..."}
        </p>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height: "300px", width: "100%" }} />
    </div>
  );
}

export default RideCost;
