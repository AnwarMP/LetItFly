import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { RiderMain } from "./pages/RiderMain.js";

function App() {

  return (
  
    <div className="wrapper">
      <Router>
        <Routes>
          <Route exact path = "/" element={<Landing />}/>
          <Route path = "/login" element={<Login />}/>
          <Route path = "/rider" element={<RiderMain />}/>
        </Routes>
      </Router>
    </div>

  );
}

export default App;
