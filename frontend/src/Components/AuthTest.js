import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, logout } from '../store/authSlice';

const AuthTest = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const testLogin = () => {
    dispatch(loginStart());
    // Simulate API call
    setTimeout(() => {
      dispatch(loginSuccess({
        user: { email: 'test@example.com' },
        token: 'fake-token-123',
        role: 'rider'
      }));
    }, 1000);
  };

  const testLoginError = () => {
    dispatch(loginStart());
    setTimeout(() => {
      dispatch(loginFailure('Test error message'));
    }, 1000);
  };

  const testLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="container mt-5">
      <h2>Auth State Test</h2>
      <div className="mb-3">
        <button onClick={testLogin} className="btn btn-primary me-2">
          Test Login
        </button>
        <button onClick={testLoginError} className="btn btn-warning me-2">
          Test Login Error
        </button>
        <button onClick={testLogout} className="btn btn-danger">
          Test Logout
        </button>
      </div>
      
      <div className="mt-3">
        <h4>Current Auth State:</h4>
        <pre>{JSON.stringify(auth, null, 2)}</pre>
      </div>
    </div>
  );
};

export default AuthTest;