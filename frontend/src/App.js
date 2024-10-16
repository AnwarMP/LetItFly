import { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import SignUp from "./pages/SignUp";
import { Driver } from "./pages/Driver";
import { RiderMain } from "./pages/RiderMain.js";
import Rider from "./pages/Rider.js";
import RideCost from "./pages/RideCost.js";

function App() {
  return (
    <div className="wrapper">
      <Router>
        <Routes>
          <Route exact path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rider" element={<Rider />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/driver" element={<Driver />} />
          <Route path="/ridecost" element={<RideCost />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
