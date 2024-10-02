import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";

function App() {

  return (
  
    <div className="wrapper">
      <Router>
        <Routes>
          <Route exact path = "/" element={<Landing />}/>
          <Route path = "/login" element={<Login />}/>
        </Routes>
      </Router>
    </div>

  );
}

export default App;
