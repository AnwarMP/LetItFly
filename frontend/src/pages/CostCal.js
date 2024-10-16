/*global google*/

// Helper function to convert degrees to radians
export function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Haversine formula for calculating distance between two coordinates (in miles)
export function getDistanceFromLatLngInMiles(start, end) {
  const { lat: lat1, lng: lon1 } = start;
  const { lat: lat2, lng: lon2 } = end;

  const R = 3958.8; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles

  return distance;
}

// Function to calculate route directions, distance, duration, and cost
export function getDirections(
  currentLocation,
  destinationLocation,
  currentMap,
  setDistance,
  setDuration,
  setCost,
  handleError // Optional callback for handling errors
) {
  if (!google || !google.maps) {
    const error = "Google Maps API is not loaded.";
    if (handleError) handleError(error);
    else console.error(error);
    return;
  }

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(currentMap);

  const request = {
    origin: currentLocation,
    destination: destinationLocation,
    travelMode: "DRIVING",
  };

  directionsService.route(request, (results, status) => {
    if (status === "OK" && results.routes.length > 0) {
      const route = results.routes[0].legs[0];

      directionsRenderer.setDirections(results);
      const distanceInMiles = route.distance.value / 1609.34; // Convert meters to miles
      const durationInMinutes = route.duration.value / 60; // Convert seconds to minutes
      const estimatedCost = calculateCost(distanceInMiles);

      setDistance(`${distanceInMiles.toFixed(2)} miles`);
      setDuration(`${durationInMinutes.toFixed(0)} mins`);
      setCost(estimatedCost);
    } else {
      const error = `Directions failed: ${status}`;
      if (handleError) handleError(error);
      else console.error(error);
    }
  });
}

// Helper function to calculate cost based on distance (in miles)
export function calculateCost(distance) {
  let baseFare = 15; // Base fare for up to 2 miles
  const costPerMile = 1.5;

  if (distance > 2) {
    baseFare += (distance - 2) * costPerMile; // Add cost for additional miles
  }

  return baseFare.toFixed(2); // Return price as string with two decimal places
}

// Function to create a Google Map instance
export function createMap(mapContainer, centerCoords, zoomLevel = 15) {
  if (!google || !google.maps) {
    console.error("Google Maps API is not loaded.");
    return null;
  }

  const mapOptions = {
    center: centerCoords,
    zoom: zoomLevel,
    disableDefaultUI: true,
    clickableIcons: false,
  };

  return new google.maps.Map(mapContainer, mapOptions);
}
