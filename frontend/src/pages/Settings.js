import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../Components/Card';
import PaymentMethodsTab from '../Components/payments/PaymentMethodsTab';
import BankAccountsTab from '../Components/bank/BankAccountsTab';
import RiderTransactionTab from '../Components/transactions/RiderTransactionTab';
import DriverTransactionTab from '../Components/transactions/DriverTransactionTab';
import './Settings.css';

const Settings = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('account'); // 'account', 'payment', or 'bank'
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    home_address: '',
    car_model: '',
    car_license_plate: '',
  });

  console.log('Current Settings State:', {
    role,
    activeTab,
    user
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (activeTab === 'account') {
      fetchUserProfile();
    }
  }, [activeTab]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen settings-container fade-in">
      <Card className="card">
        <CardHeader className="card-header">
          <CardTitle className="card-title">Settings</CardTitle>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            {role === 'rider' && (
              <button
                className={`tab ${activeTab === 'payment' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                Payment Methods
              </button>
            )}
            {role === 'driver' && (
              <button
                className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
                onClick={() => setActiveTab('bank')}
              >
                Bank Accounts
              </button>
            )}
            <button
              className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              {role === 'rider' ? 'Transactions' : 'Earnings'}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'account' && (
            <form onSubmit={handleSubmit} className="grid-form">
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
              <div className="form-group full-width">
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
            {error && <div className="error-message full-width">{error}</div>}
            {successMessage && (
              <div className="success-message full-width">{successMessage}</div>
            )}
            <div className="button-group full-width">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-edit"
                >
                  Edit Profile
                </button>
              ) : (
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-save"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
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
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-logout"
              >
                Logout
              </button>
            </div>
          </form>
          )}
          {activeTab === 'payment' && role === 'rider' && (
            <PaymentMethodsTab />
          )}
          {activeTab === 'bank' && role === 'driver' && (
            <BankAccountsTab />
          )}
          {activeTab === 'transactions' &&
            (role === 'rider' ? (
              <RiderTransactionTab />
            ) : (
              <DriverTransactionTab />
            ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;