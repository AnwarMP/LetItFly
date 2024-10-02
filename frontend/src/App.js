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
      <div className="airports">
        <div className="text">Go To And From...</div>
        <div cassName="cards">

          <div class="card-design">
            <div className="card-box"></div>
            <div className="card-text">SFO</div>
          </div>

          <div class="card-design">
            <div className="card-box"></div>
            <div className="card-text">OAK</div>
          </div>

          <div class="card-design">
            <div className="card-box"></div>
            <div className="card-text">SJC</div>
          </div>
        </div>
      </div>

    </body>
  );
}

export default App;
