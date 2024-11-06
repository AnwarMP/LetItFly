import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from "./store";
import { PrivateRoute } from "./Components/PrivateRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import SignUp from "./pages/SignUp";
import { Driver } from "./pages/Driver";
import { RiderMain } from "./pages/RiderMain";

function App() {
    return (
        <Provider store={store}>
            <div className="wrapper">
                <Router>
                    <Routes>
                        {/* Public routes */}
                        <Route exact path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        
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
                    </Routes>
                </Router>
            </div>
        </Provider>
    );
}

export default App;