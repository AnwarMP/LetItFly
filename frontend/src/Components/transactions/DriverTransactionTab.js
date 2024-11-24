import React, { useState, useEffect } from 'react';

const DriverTransactionTab = () => {
  const [summary, setSummary] = useState(null); // To store the earnings summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:3000/api/payments/transactions/earnings', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log('API Response:', response);

        if (!response.ok) throw new Error('Failed to fetch earnings.');
        const data = await response.json();
        console.log('Earnings Data:', data);

        setSummary(data.summary || {});
      } catch (err) {
        console.error('Error Fetching Earnings:', err);
        setError('Failed to load earnings.');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  return (
    <div className="driver-transactions-tab">
      <h2>Your Earnings</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : summary ? (
        <div className="earnings-summary">
          <p>
            <strong>Total Rides:</strong> {summary.total_rides}
          </p>
          <p>
            <strong>Total Earnings:</strong> ${parseFloat(summary.total_earnings).toFixed(2)}
          </p>
          <p>
            <strong>Average Ride:</strong> ${parseFloat(summary.average_ride).toFixed(2)}
          </p>
          <p>
            <strong>Minimum Ride:</strong> ${parseFloat(summary.min_ride).toFixed(2)}
          </p>
          <p>
            <strong>Maximum Ride:</strong> ${parseFloat(summary.max_ride).toFixed(2)}
          </p>
        </div>
      ) : (
        <p>No earnings data available.</p>
      )}
    </div>
  );
};

export default DriverTransactionTab;