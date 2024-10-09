import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Landing } from "./Pages/Landing";
import { Login } from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import { Driver } from "./Pages/Driver";
import { RiderMain } from "./pages/RiderMain.js";

function App() {

  return (
  
        <div className="wrapper">
            <Router>
                <Routes>
                    <Route exact path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/rider" element={<RiderMain />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/driver" element={<Driver />} />
                </Routes>
            </Router>
        </div>

  );
}

export default App;
