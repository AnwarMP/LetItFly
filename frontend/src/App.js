import logo from './logo.svg';
import './App.css';

import { useState } from 'react';
import ReactDOM from 'react-dom/client';


// function ProcessLogin() {

// }


function App() {
  const [inputs, setInputs] = useState({});

  const handleSetValue = (event) => {
    const entry = event.target.name;
    const pass = event.target.value;
    setInputs(values => ({...values, [entry]: pass}))
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (inputs.user == 'John' && inputs.pass == '123') {
      alert("passed login check");
    }
  }


  return (
    // <div className="App">
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />
    //     <p>
    //       Edit <code>src/App.js</code> and save to reload.
    //     </p>
    //     <a
    //       className="App-link"
    //       href="https://reactjs.org"
    //       target="_blank"
    //       rel="noopener noreferrer"
    //     >
    //       Learn React
    //     </a>
    //   </header>
    // </div>

    <body>
      <div className="nav">
        <div className="left-section">
          <div className="logo">Let It Fly</div>
            <ul>
              <li><a href="#">Ride</a></li>
              <li><a href="#">Drive</a></li>
              <li><a href="#">About</a></li>
            </ul>
        </div>
        <ul>
          <li><a href="LoginPage.js">Log in</a></li>
          <li><a href="#">Sign up</a></li>
        </ul>
      </div>


      <div className="numerical">
        <div className="container">
          
        <form onSubmit={handleSubmit}>
          <label>Enter your username:
            <br/>
            <input 
              type="text" 
              name="user"
              value={inputs.user || ""}
              onChange={handleSetValue}
            />
          </label>
          <br/>
          <label>Enter your pass:
            <br/>
            <input 
              type="text" 
              name="pass"
              value={inputs.pass || ""}
              onChange={handleSetValue}
            />
          </label>
          <br/>
          <input type="submit" />
        </form>

        </div>
      </div>

      
    </body>
  );
}

export default App;
