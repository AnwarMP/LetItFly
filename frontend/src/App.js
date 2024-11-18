import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from "./store";
import { Navbar } from "./Components/NavBar";
import { PrivateRoute } from "./Components/PrivateRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import RiderSignUp from "./pages/RiderSignUp";
import DriverSignUp from "./pages/DriverSignUp";
import { Driver } from "./pages/Driver";
import { RiderMain } from "./pages/RiderMain";
import Settings from './pages/Settings'; 

function App() {
    return (
        <Provider store={store}>
            <div className="wrapper">
                <Router>
                    <Navbar />
                    <Routes>
                        {/* Public routes */}
                        <Route exact path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/driver-signup" element={<DriverSignUp />} />
                        <Route path="/rider-signup" element={<RiderSignUp />} />

                        {/* Protected routes */}
                        <Route
                            path="/rider"
                            element={
                                <PrivateRoute roles={['rider']}>
                                    <RiderMain />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/driver"
                            element={
                                <PrivateRoute roles={['driver']}>
                                    <Driver />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <PrivateRoute roles={['rider', 'driver']}>
                                <Settings />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </Router>
            </div>
        </Provider>
    );
}

export default App;
