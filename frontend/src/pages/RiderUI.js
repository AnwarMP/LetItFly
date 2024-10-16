import React from "react";
import Map from "./Map"; // Import the Map component

const RiderUI = ({
  pickup,
  dropoff,
  setPickup,
  setDropoff,
  pickupInputRef,
  dropoffInputRef,
  setPickupCoords,
  setDropoffCoords,
  handleQuickPick,
  handleLocationPermission,
  handleSubmit,
  airports,
  activeInput,
  setActiveInput,
}) => (
  <div className="ride-dashboard">
    <h1 className="dashboard-title">Go anywhere with Let It Fly</h1>

    {/* Default Airport Buttons */}
    <div className="default-airport-buttons">
      {Object.entries(airports).map(([code, airport]) => (
        <button
          key={code}
          className="btn btn-airport"
          onClick={() => handleQuickPick(airport)}
        >
          {airport.name}
        </button>
      ))}
    </div>

    {/* Pickup and Dropoff Location Inputs */}
    <div className="location-section">
      <input
        ref={pickupInputRef}
        type="text"
        placeholder="Enter pickup location"
        value={pickup}
        onFocus={() => setActiveInput("pickup")}
        onChange={(e) => setPickup(e.target.value)}
        className="form-control"
      />
      <button onClick={handleLocationPermission} className="btn btn-location">
        Use Current Location
      </button>

      <input
        ref={dropoffInputRef}
        type="text"
        placeholder="Enter dropoff location"
        value={dropoff}
        onFocus={() => setActiveInput("dropoff")}
        onChange={(e) => setDropoff(e.target.value)}
        className="form-control"
      />

      {/* Date and Time Selection */}
      <div className="datetime-section">
        <select className="form-control">
          <option value="Today">Today</option>
          <option value="Tomorrow">Tomorrow</option>
        </select>
        <select className="form-control">
          <option value="Now">Now</option>
          <option value="Later">Later</option>
        </select>
      </div>

      {/* Submit Button */}
      <button onClick={handleSubmit} className="btn btn-primary">
        See Prices
      </button>
    </div>

    {/* Map Component */}
    <Map
      pickup={pickup}
      dropoff={dropoff}
      setPickup={setPickup}
      setDropoff={setDropoff}
      setPickupCoords={setPickupCoords}
      setDropoffCoords={setDropoffCoords}
      activeInput={activeInput}  // Pass activeInput to determine if selecting for pickup or dropoff
    />
  </div>
);

export default RiderUI;
