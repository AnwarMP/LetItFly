import React, { useRef } from "react";
import Map from "./Map";

const RiderUI = ({
  pickup,
  dropoff,
  setPickup,
  setDropoff,
  setPickupCoords,
  setDropoffCoords,
  handleQuickPick,
  handleLocationPermission,
  handleSubmit,
  airports,
  activeInput,
  setActiveInput,
}) => {
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  return (
    <div className="ride-dashboard">
      <h1 className="dashboard-title">Explore Bay Area - Ride Now </h1>
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

      <div className="location-section">
        <input
          ref={pickupInputRef}
          type="text"
          placeholder="Enter pickup location or Select an airport "
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
        {/* if we handle scheduling later
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
       
    */}
        <button onClick={handleSubmit} className="btn btn-primary">
          See Prices
        </button>
      </div>
      <Map
        pickup={pickup}
        dropoff={dropoff}
        setPickup={setPickup}
        setDropoff={setDropoff}
        pickupInputRef={pickupInputRef}
        dropoffInputRef={dropoffInputRef}
        setPickupCoords={setPickupCoords}
        setDropoffCoords={setDropoffCoords}
        activeInput={activeInput}
      />
    </div>
  );
};

export default RiderUI;
