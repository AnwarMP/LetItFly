import React from 'react';
import { Link } from 'react-router-dom';
import './Driver.css';


export const Driver = () => {
    const name = 'John Doe';
    const license = "0tst000"

    
    return (
        <body>
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

            <div className='box-container'>


                

                <div className='left-column text-center'>
                <br/><br/><br/><br/><br/><br/><br/>
                    <img src = '/default-profile.png'></img><br/>
                    {/* This is a placeholder, replace with JS elements that get name from DB */}
                    <span id='name-text'>John Doe</span><br/><br/>
                    <button className='btn btn-primary btn-circle btn-lg'>Start Work</button>
                    <div className='disclaimer-text'>Note: This will use your location</div><br/>
                    {/* This is a placeholder, replace with JS elements that get license from DB */}
                    <h6>License Plate: 0tst000</h6>
                </div>      
                <div className='right-column'>
                    <div className='image-container'>
                        <img src='/SJC-map.png'></img>
                    </div>
                </div>   

            </div>
        </body>
    );
}