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
        <div className="logo">Let It Fly</div>
        <ul>
          <li><a href="#">link one</a></li>
          <li><a href="#">link two</a></li>
          <li><a href="#">link three</a></li>
        </ul>
        <ul>
          <li><a href="#">Log in</a></li>
          <li><a href="#">Sign up</a></li>
        </ul>
      </div>
      <div className="introduction">
        <div className="text">
          <div className="slogan-1">Fast. Convenient.</div>
          <div className="slogan-2">Let It Fly - On Your Schedule.</div>
          <div className="about-1">Bay Area Airports' Premier Shuttle Service.</div>
        </div>
        <div className="image">
          Here.
        </div>
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
