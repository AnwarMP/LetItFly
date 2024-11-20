import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/Card';
import PaymentMethods from '../Components/payment/PaymentMethods';
import Wallet from '../Components/wallet/Wallet';
import './Settings.css';

const Settings = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
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

  const renderProfileForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                disabled={true}
                className="bg-gray-50"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            {role === 'rider' && (
              <div className="form-group col-span-2">
                <label>Home Address</label>
                <input
                  type="text"
                  name="home_address"
                  value={formData.home_address || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            )}

            {role === 'driver' && (
              <>
                <div className="form-group">
                  <label>Car Model</label>
                  <input
                    type="text"
                    name="car_model"
                    value={formData.car_model || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label>License Plate</label>
                  <input
                    type="text"
                    name="car_license_plate"
                    value={formData.car_license_plate || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="text-red-600">{error}</div>
          )}
          
          {successMessage && (
            <div className="text-green-600">{successMessage}</div>
          )}

          <div className="flex justify-end space-x-4">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-edit"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchUserProfile();
                  }}
                  className="btn btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-save"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="settings-container">
      <div className="settings-content">
        <div className="settings-layout">
          {/* Sidebar Navigation */}
          <div className="settings-sidebar">
            <div className="sidebar-nav">
              <nav className="nav-buttons">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`nav-button ${activeTab === 'payment' ? 'active' : ''}`}
                >
                  Payment Methods
                </button>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`nav-button ${activeTab === 'wallet' ? 'active' : ''}`}
                >
                  Wallet
                </button>
                <button
                  onClick={handleLogout}
                  className="nav-button logout"
                >
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="settings-main">
            {activeTab === 'profile' && renderProfileForm()}
            {activeTab === 'payment' && <PaymentMethods />}
            {activeTab === 'wallet' && <Wallet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;