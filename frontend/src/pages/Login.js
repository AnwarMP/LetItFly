import React from 'react'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import './App.css';



export const Login = () => {

    const [inputs, setInputs] = useState({});
    const handleSetValue = (event) => {
      const entry = event.target.name;
      const pass = event.target.value;
      setInputs(values => ({...values, [entry]: pass}))
    }
  
    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
          const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: inputs.email, password: inputs.pass }),
          });
      
          const data = await response.json();
          if (response.ok) {
            alert('Login successful!');
            // Save the token in localStorage or state for future requests
            localStorage.setItem('token', data.token);
            window.location.replace('/');
          } else {
            alert(data.message);
          }
        } catch (error) {
          console.error('Login failed', error);
          alert('Login failed. Please try again.');
        }
      };      


    return (

        <body className="bg">
            <div className="custom-nav">
                <div className="left-section">
                    <div className="logo">Let It Fly</div>
                    <ul>
                        <li><a href="#">Ride</a></li>
                        <li><a href="#">Drive</a></li>
                        <li><a href="#">About</a></li>
                    </ul>
                </div>
                <ul>
                    <li><Link to="/login" className='nav-button'>Log in</Link></li>
                    <li><a href="#">Sign up</a></li>
                </ul>
            </div>
                
            <div className="numerical">
                <div className="container">
                    <br/><br/><br/>
                    <form className="form-group custom-form" onSubmit={handleSubmit}>
                        <label>Enter your email:</label>
                    <br/>
                        <input 
                            type="email" 
                            name="email"
                            required className = 'form-control'
                            value={inputs.email || ""}
                            onChange={handleSetValue}
                        />

                        <br/>
                        <label>Enter your password:</label>
                        <br/>
                        <input 
                            type="password" 
                            name="pass"
                            required className = 'form-control'
                            value={inputs.pass || ""}
                            onChange={handleSetValue}
                        />
                    <br/>
                    <br/>
                        <button type='submit' className='btn btn-success btn-md'>Login</button>
                    </form>
                </div>
            </div>
        </body>
    )
}