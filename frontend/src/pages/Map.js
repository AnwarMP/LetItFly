import React, { useState, useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";

function Map({
  pickup,
  dropoff,
  setPickup,
  setDropoff,
  pickupInputRef,
  dropoffInputRef,
}) {
  const [map, setMap] = useState(null);
  const [pickupMarker, setPickupMarker] = useState(null);
  const [dropoffMarker, setDropoffMarker] = useState(null);
  const [google, setGoogle] = useState(null);

  // Initialize Google Maps API
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: ["places"],
    });

    loader
      .load()
      .then((googleInstance) => {
        setGoogle(googleInstance);
        const mapInstance = new googleInstance.maps.Map(
          document.getElementById("map"),
          {
            center: { lat: 37.7749, lng: -122.4194 }, // San Francisco center
            zoom: 11,
          }
        );
        setMap(mapInstance);
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error);
      });
  }, []);

  // Initialize Autocomplete after map loads and refs are available
  useEffect(() => {
    if (!google || !map) return;

    const initAutocomplete = (inputRef, setLocation, updateMarker) => {
      if (!inputRef || !inputRef.current) {
        console.warn(
          `Input ref is not available for autocomplete initialization`
        );
        return null;
      }

      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(37.2, -122.6), // SW corner of Bay Area
        new google.maps.LatLng(38.0, -122.0) // NE corner of Bay Area
      );

      const autocomplete = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          bounds,
          strictBounds: true,
          fields: ["formatted_address", "geometry"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          setLocation(place.formatted_address);
          updateMarker(place.geometry.location);
        }
      });

      return autocomplete;
    };

    const pickupAutocomplete = initAutocomplete(
      pickupInputRef,
      setPickup,
      updatePickupMarker
    );
    const dropoffAutocomplete = initAutocomplete(
      dropoffInputRef,
      setDropoff,
      updateDropoffMarker
    );

    // Cleanup listeners when component unmounts
    return () => {
      if (pickupAutocomplete)
        google.maps.event.clearInstanceListeners(pickupAutocomplete);
      if (dropoffAutocomplete)
        google.maps.event.clearInstanceListeners(dropoffAutocomplete);
    };
  }, [google, map, pickupInputRef, dropoffInputRef]);

  // Update markers on the map
  const updatePickupMarker = (location) => {
    if (!google || !map) return;

    if (pickupMarker) pickupMarker.setMap(null);
    const marker = new google.maps.Marker({
      position: location,
      map,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", //icon
        scaledSize: new google.maps.Size(40, 40),
      },
    });
    setPickupMarker(marker);
    map.panTo(location);
  };

  const updateDropoffMarker = (location) => {
    if (!google || !map) return;

    if (dropoffMarker) dropoffMarker.setMap(null);
    const marker = new google.maps.Marker({
      position: location,
      map,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new google.maps.Size(40, 40),
      },
    });
    setDropoffMarker(marker);

    if (pickupMarker) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickupMarker.getPosition());
      bounds.extend(marker.getPosition());
      map.fitBounds(bounds);
    } else {
      map.panTo(location);
    }
  };

  return <div id="map" className="map-section"></div>;
}

export default Map;
