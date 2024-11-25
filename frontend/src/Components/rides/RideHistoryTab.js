import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardContent } from '../Card';

const RideHistoryTab = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const { role } = useSelector(state => state.auth);

  const API_BASE_URL = "";

  const fetchRides = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/rides/history`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch ride history');
      const data = await response.json();
      setRides(data.rides);
    } catch (err) {
      console.error(err);
      setError('Failed to load ride history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRideDetails = async (rideId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/rides/${rideId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch ride details');
      const data = await response.json();
      setSelectedRide(data.ride);
    } catch (err) {
      console.error(err);
      setError('Failed to load ride details.');
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRideStatusColor = (status) => {
    const colors = {
      'requested': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const RideCard = ({ ride }) => (
    <div 
      className="border rounded-lg p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => fetchRideDetails(ride.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold">{formatDate(ride.created_at)}</p>
          <p className="text-sm text-gray-600">
            {role === 'rider' ? `Driver: ${ride.driver_first_name} ${ride.driver_last_name}` 
                             : `Rider: ${ride.rider_first_name} ${ride.rider_last_name}`}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-sm ${getRideStatusColor(ride.ride_status)}`}>
          {ride.ride_status.replace('_', ' ')}
        </span>
      </div>
      <div className="mt-2">
        <p><strong>From:</strong> {ride.pickup_location}</p>
        <p><strong>To:</strong> {ride.dropoff_location}</p>
        <p><strong>Fare:</strong> ${parseFloat(ride.final_fare || ride.estimated_fare).toFixed(2)}</p>
      </div>
    </div>
  );

  const RideDetails = ({ ride }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-xl font-bold mb-4">Ride Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Date:</strong> {formatDate(ride.created_at)}</p>
            <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-sm ${getRideStatusColor(ride.ride_status)}`}>
              {ride.ride_status.replace('_', ' ')}
            </span></p>
            <p><strong>From:</strong> {ride.pickup_location}</p>
            <p><strong>To:</strong> {ride.dropoff_location}</p>
          </div>
          <div>
            <p><strong>Rider:</strong> {ride.rider_first_name} {ride.rider_last_name}</p>
            <p><strong>Driver:</strong> {ride.driver_first_name} {ride.driver_last_name}</p>
            <p><strong>Estimated Fare:</strong> ${parseFloat(ride.estimated_fare).toFixed(2)}</p>
            {ride.final_fare && (
              <p><strong>Final Fare:</strong> ${parseFloat(ride.final_fare).toFixed(2)}</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <button 
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            onClick={() => setSelectedRide(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ride-history-tab">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Ride History</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading rides...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : rides.length === 0 ? (
            <p>No rides found.</p>
          ) : (
            <div className="space-y-4">
              {rides.map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRide && <RideDetails ride={selectedRide} />}
    </div>
  );
};

export default RideHistoryTab;