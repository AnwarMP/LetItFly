/*global google*/
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RiderUI from "./RiderUI";
import "./Rider.css";
import "./App.css";

function Rider() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const navigate = useNavigate();

  const airports = {
    SFO: {
      name: "San Francisco International Airport",
      lat: 37.6213,
      lng: -122.379,
    },
    SJC: {
      name: "San Jose International Airport",
      lat: 37.3639,
      lng: -121.9289,
    },
    OAK: {
      name: "Oakland International Airport",
      lat: 37.7213,
      lng: -122.221,
    },
  };

  // Debugging effect to check ref initialization
  useEffect(() => {
    console.log("Component mounted. Checking refs:");
    console.log("Pickup ref:", pickupInputRef.current);
    console.log("Dropoff ref:", dropoffInputRef.current);
  }, []);

  const geocodeAddress = (address, callback) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        callback(location);
      } else {
        console.error("Geocoding failed: ", status);
        alert(`Unable to geocode the address: ${address}`);
      }
    });
  };

  const handleLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };

          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location }, (results, status) => {
            if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;
              setPickup(address);
              setPickupCoords(location);
            } else {
              setPickup(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              setPickupCoords(location);
            }
          });
        },
        () => {
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleQuickPick = (airport) => {
    const location = { lat: airport.lat, lng: airport.lng };
    if (activeInput === "pickup") {
      setPickup(airport.name);
      setPickupCoords(location);
      setActiveInput(null);
    } else if (activeInput === "dropoff") {
      setDropoff(airport.name);
      setDropoffCoords(location);
      setActiveInput(null);
    }
  };

  const handleSubmit = () => {
    if (pickup && dropoff) {
      const promises = [];

      if (!pickupCoords) {
        promises.push(
          new Promise((resolve) => {
            geocodeAddress(pickup, (location) => {
              const coords = { lat: location.lat(), lng: location.lng() };
              setPickupCoords(coords);
              resolve(coords);
            });
          })
        );
      }

      if (!dropoffCoords) {
        promises.push(
          new Promise((resolve) => {
            geocodeAddress(dropoff, (location) => {
              const coords = { lat: location.lat(), lng: location.lng() };
              setDropoffCoords(coords);
              resolve(coords);
            });
          })
        );
      }

      Promise.all(promises).then((coords) => {
        const newPickupCoords = pickupCoords || coords[0];
        const newDropoffCoords = dropoffCoords || coords[1];

        if (newPickupCoords && newDropoffCoords) {
          navigate("/ridecost", {
            state: {
              pickup,
              dropoff,
              pickupCoords: newPickupCoords,
              dropoffCoords: newDropoffCoords,
            },
          });
        }
      });
    } else {
      alert("Please enter both pickup and dropoff locations.");
    }
  };

  return (
    <div className="rider-dashboard-container">
      <RiderUI
        pickup={pickup}
        dropoff={dropoff}
        setPickup={setPickup}
        setDropoff={setDropoff}
        pickupInputRef={pickupInputRef}
        dropoffInputRef={dropoffInputRef}
        setPickupCoords={setPickupCoords}
        setDropoffCoords={setDropoffCoords}
        handleQuickPick={handleQuickPick}
        handleLocationPermission={handleLocationPermission}
        handleSubmit={handleSubmit}
        airports={airports}
        activeInput={activeInput}
        setActiveInput={setActiveInput}
      />
    </div>
  );
}

export default Rider;
