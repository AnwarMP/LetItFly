import logo from './logo.svg';
import './App.css';

function App() {
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
          <li><a href="#">Log in</a></li>
          <li><a href="#">Sign up</a></li>
        </ul>
      </div>
      <div className="introduction">
        <div className="text">
          <div className="slogan">Fast. </div>
          <div className="slogan">Convenient.</div>
          <div className="slogan">Always On Your Schedule.</div>
          <div className="slogan">Let It Fly.</div>
          <div className="about">Bay Area's Premier Airport Shuttle Service.</div>
          <div className="button-options">
            <button>Ride With Us</button>
            <button>Drive With Us</button>
          </div>
        </div>
        <img src="/Driving.png" alt="Driving Over The Golden Gate Bridge" />
      </div>

      <div className="numerical">
        <div className="container">
          <div className="text-1">&lt; 30</div>
          <div className="text-2">minutes</div>
          <div className="small-text">Guaranteed wait time</div>
        </div>
        <div className="container">
          <div className="text-1">$15</div>
          <div className="text-2">minimum</div>
          <div className="small-text">Competitive pricing</div>
        </div>
        <div className="container">
          <div className="text-1">2</div>
          <div className="text-2">miles</div>
          <div className="small-text">Free of charge</div>
        </div>
      </div>
      {/* <div className="airports">
        <div className="text">Our Airports</div>
        <div className="cards">

          <div className="card-design">
            <div className="card-box">
              <img src="/SFO.png" alt="SFO Airport"></img>
            </div>
            <div className="card-text">SFO</div>
          </div>

          <div className="card-design">
            <div className="card-box">
              <img src="/OAK.png" alt="OAK Airport"></img>
            </div>
            <div className="card-text">OAK</div>
          </div>

          <div className="card-design">
            <div className="card-box">
              <img src="/SJC.png" alt="SJC Airport"></img>
            </div>
            <div className="card-text">SJC</div>
          </div>
        </div>
      </div> */}

    </body>
  );
}

export default App;
