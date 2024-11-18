import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/Card';

const Settings = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    home_address: '',
    car_model: '',
    car_license_plate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setFormData(data.user);
      } else {
        setError('Failed to fetch profile data');
      }
    } catch (error) {
      setError('Error loading profile');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:3000/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
        setIsEditing(false);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    disabled={true}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  />
                </div>

                {role === 'rider' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Home Address</label>
                    <input
                      type="text"
                      name="home_address"
                      value={formData.home_address || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                )}

                {role === 'driver' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">Car Model</label>
                      <input
                        type="text"
                        name="car_model"
                        value={formData.car_model || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">License Plate</label>
                      <input
                        type="text"
                        name="car_license_plate"
                        value={formData.car_license_plate || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}
              
              {successMessage && (
                <div className="text-green-600 text-sm mt-2">{successMessage}</div>
              )}

              <div className="flex justify-between mt-6">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        fetchUserProfile();
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;